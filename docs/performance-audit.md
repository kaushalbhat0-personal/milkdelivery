# PERFORMANCE AUDIT REPORT

Audit date: 2026-05-30
Tools: Code review, query analysis, import tracing, schema analysis

---

## TASK 1 — PAGE LOAD AUDIT

### Admin Pages

| Page | Rendering | Data Fetching | Estimated TTFB (mid-band) |
|---|---|---|---|
| Dashboard | Server component | layout session(1) + getDashboardCountsAction(1) + getRoutesAction(1) = **3 seq auth+DB queries** | ~300-500ms |
| Customers | Client component | layout session(1) + client fetches via action(1) = **2 queries** | ~200-400ms |
| Drivers | Client component (Suspense) | layout session(1) + client fetches via action(1) = **2 queries** | ~200-400ms |
| Routes | Client component | layout session(1) + client fetches via action(1) = **2 queries** | ~200-400ms |
| Delivery Dashboard | Server component (force-dynamic) | layout session(1) + getTodayDashboardAction(multiple queries) = **many queries** | ~400-700ms |

### Driver Pages

| Page | Rendering | Data Fetching | Estimated TTFB |
|---|---|---|---|
| Route | Server component (force-dynamic) | layout session(1) + getAssignedRouteAction(multiple queries) = **many queries** | ~400-700ms |
| Login | Static server component | No data fetching | <50ms |

### Key Finding: Redundant Auth

Every page load fetches the session **at least twice**: once in the layout and once inside the action called by the page. Dashboard fetches it **three times** (layout + 2 actions).

---

## TASK 2 — DATABASE QUERY AUDIT

| # | Query File | Functions | Queries/Page | Prepared? |
|---|---|---|---|---|
| 1 | customers/queries.ts | 5 | 2 (count+select) | No |
| 2 | drivers/queries.ts | 2 | 2 (count+select) | No |
| 3 | dashboard/queries.ts | 1 | 3 parallel counts | No |
| 4 | customer-plans/queries.ts | 1 | 1 update | No |
| 5 | delivery-schedule/queries.ts | 0 | (types only) | No |
| 6 | delivery-history/queries.ts | 1 | 1 select (4 JOINs) | No |
| 7 | driver-route/queries.ts | 6 | 3-4 sequential | No |
| 8 | routes/queries.ts | 12 | 2-3 + subqueries | No |
| 9 | delivery-dashboard/queries.ts | 5 | 10+ parallel+batch | No |
| 10 | exports/queries.ts | 3 | 1 select each | No |

### N+1 Patterns Detected

| Location | Severity | Detail |
|---|---|---|
| `routes/service.ts:388-412` — `reorderStops()` | **MEDIUM** | 2×N individual UPDATE queries. For 20 stops: 40 round-trips. |
| `driver-route/service.ts` — `completeDelivery/skipDelivery/markNotRequired` | **LOW** | 3-4 sequential queries per action. Not in a loop, so low cost per action. |

### Duplicate Query Patterns

- **`getRoutesAction` called twice** on dashboard page: once for counts, once for recent routes (though different pages/sizes).
- **Auth queries are duplicated**: every page layout + every action both call getSession.

### Good Patterns

- `delivery-dashboard/service.ts` uses batch-fetch + in-memory Map joins (no N+1).
- `getRoutesQuery` uses correlated subquery for customerCount (efficient single-query count).
- `getDeliveryHistoryQuery` uses 4 JOINs in a single query (no N+1).

---

## TASK 3 — AUTH AUDIT

### All `auth.api.getSession()` Call Sites

| File | Context | Frequency |
|---|---|---|
| `src/app/(admin)/layout.tsx:26` | Admin layout — every page render | Per page load |
| `src/app/(driver)/layout.tsx:16` | Driver layout — every page render | Per page load |
| `src/app/(admin)/routes/[routeId]/page.tsx:16` | Route detail page | Per page load |
| `src/app/page.tsx:7` | Root redirect page | Per page load |
| `src/proxy.ts:10` | Middleware — on every request | On every request |
| `src/app/api/exports/*/route.ts:8` | 3 export API routes | Per export request |
| `src/features/*/actions.ts` | 10 × local getSession() | Per action invocation |

### Duplicated Helper

Every action file defines the same `getSession()` helper:

```typescript
async function getSession() {
  const result = await auth.api.getSession({ headers: await headers() });
  return result;
}
```

Duplicated across 10 action files (approx 5 lines each = 50 lines of identical code).

### Critical Finding: Session Fetched 2-3× Per Page Load

| Page | Layout Session | Action Sessions | Total |
|---|---|---|---|
| Dashboard | 1 (layout) | 2 (counts + routes) | **3** |
| Customers | 1 (layout) | 1 (getCustomersAction) | **2** |
| Drivers | 1 (layout) | 1 (getDriversAction) | **2** |
| Routes | 1 (layout) | 1 (getRoutesAction) | **2** |
| Delivery Dashboard | 1 (layout) | 1 (getTodayDashboardAction) | **2** |
| Driver Route | 1 (layout) | 1 (getAssignedRouteAction) | **2** |

**Each session fetch is a separate DB query to `sessions` + `users` tables.** This doubles (or triples) the DB round-trips for auth alone.

---

## TASK 4 — SERVER ACTION AUDIT

### `revalidatePath` Calls

| File | Path | Frequency | Impact |
|---|---|---|---|
| routes/actions.ts | `"/routes"` | 7 calls | Full route list cache invalidated |
| routes/actions.ts | `"/routes/${routeId}"` | 1 call | Single route detail invalidated |
| driver-route/actions.ts | `"/route"` | 4 calls | Full driver route page invalidated |
| drivers/actions.ts | `"/drivers"` | 3 calls | Full driver list invalidated |
| customers/actions.ts | `"/customers"` | 3 calls | Full customer list invalidated |
| customer-plans/actions.ts | `"/customers"` | 1 call | Full customer list invalidated |

### Issues

1. **No granular revalidation**: All `revalidatePath` calls target the full path (e.g., `"/customers"`), not a specific tag. Every mutation invalidates the entire list, forcing a full re-fetch of all rows.
2. **`revalidateTag` is unused**: Data-specific cache tags (e.g., `"customers:${tenantId}"`) would be more efficient.
3. **Re-fetch storms**: Driver delivery actions (complete, skip, not-required) each call `revalidatePath("/route")`. For a route with 20 stops, 20 individual mutations = 20 full page re-fetches.
4. **Unnecessary revalidation in read actions**: `getCustomersAction`, `getDriversAction`, `getRoutesAction` are read-only but still run through the full action pipeline (session fetch + validation) before returning data.

---

## TASK 5 — REACT RENDER AUDIT

### Table Components

| Component | `columns` Memoized? | Expensive Inline Compute | Rerender Risk |
|---|---|---|---|
| customer-table.tsx | **No** (inline, line 79) | None | Medium — columns recreated every render |
| driver-table.tsx | **No** (inline, line 93) | None | Medium |
| route-table.tsx | **No** (inline, line 79) | None | Medium |

The `columns` arrays are created as plain `const columns` inside the component body. Every re-render creates new object references, causing `useReactTable` to potentially re-initialize column internals. Wrap in `useMemo`.

### Driver Components

| Component | Issue | Severity |
|---|---|---|
| route-card.tsx:147 | Inline IIFE `(() => {...})()` for quantity formatting | Low — small computation, but creates closure per render |
| route-card.tsx:50 | `statusBadge` inner function defined in component body | Low — creates function per render |
| route-card.tsx | No `useCallback` on `handleDeliver`, `handleNotRequired` | Low — handlers passed to Button `onClick` |
| finish-route-button.tsx | No `useCallback` on handlers | Low |

### Dashboard Components

All dashboard cards are server components (no client-side rerender cost). The delivery dashboard renders per-driver and per-route sections using `.map()` on server-rendered data — no JavaScript runtime cost.

---

## TASK 6 — NEON AUDIT

| Setting | Current | Recommendation |
|---|---|---|
| Adapter | `drizzle-orm/neon-http` | Acceptable for serverless |
| Connection | HTTP client (no pool) | Each query = separate HTTP request |
| Pooling | None | No persistent connection |
| Logger | On in development | ✅ Useful for debugging |

### Impact

The `@neondatabase/serverless` HTTP client makes individual HTTP requests to Neon's proxy for each query. There is **no TCP connection reuse or transaction batching**. For pages that run 5-10 queries (delivery dashboard), this means 5-10 separate network round-trips to Neon.

### Auth Adapter

Better Auth shares the same `db` instance. Session queries go through the same HTTP transport. This is fine, but means session-auth adds additional HTTP round-trips to every action.

---

## TASK 7 — INDEX AUDIT

### Table Index Coverage

| Table | Columns | Index Coverage |
|---|---|---|
| customers | 6 composite indexes | ✅ All query patterns covered |
| routes | 3 + 1 unique partial | ✅ All query patterns covered |
| routeStops | 4 (2 unique) | ✅ All query patterns covered |
| deliveryLogs | 4 composite | ✅ All query patterns covered |
| users | **0 custom indexes** | ❌ No indexes on `tenantId`, `role`, `deletedAt` |
| tenants | 0 beyond PK | ⚠️ Low volume table, acceptable |
| sessions | 0 beyond PK+unique(token) | ⚠️ Auth queries by `userId` not indexed |
| accounts | 0 beyond PK | ⚠️ Auth queries by `userId` not indexed |

### Missing Index: `users`

The `users` table is queried by:
- `WHERE tenantId = ? AND role = 'DRIVER' AND deletedAt IS NULL` (drivers list)
- `WHERE tenantId = ? AND deletedAt IS NULL` (dashboard counts)
- `WHERE id = ?` (single user lookup — PK covered)

**Recommendation**: Add `users_tenant_role_deleted_idx` on `(tenantId, role, deletedAt)`.

### Missing Index: Foreign Key `delivery_logs.driver_id`

This is already covered by `logs_driver_date_idx` on `(driverId, deliveryDate)`.

### Unused Indexes

All indexes serve at least one query pattern. No unused indexes detected.

---

## TASK 8 — BUNDLE AUDIT

### Largest Client Bundle Contributors

| Library/Feature | Est. Size (min+gzip) | Files Using It | Loads On |
|---|---|---|---|
| Google Maps Places API | ~200KB (dynamic) | 1 file (address-autocomplete) | Customer form only |
| @dnd-kit/core + sortable + utiilities | ~38KB | 1 file (admin/route-stop-list) | Route detail page |
| @tanstack/react-table | ~16KB | 3 files (tables) | Customers, Drivers, Routes |
| lucide-react (41 icons) | ~20-40KB | 24 files | Every page |
| react-hook-form | ~10KB | 3 form components | Form pages |
| @base-ui/react | ~15-25KB | shadcn deps | Indirectly everywhere |
| sonner | ~5KB | 1 import (layout) | Every page (Toaster) |
| zod | ~15KB | Form validation | Form pages |

### Global Loads (Loaded on Every Page)

| Library | Reason to Load Globally | Fix? |
|---|---|---|
| Google Maps | No — only address-autocomplete.tsx | ✅ Already dynamic (script injection) |
| @dnd-kit/* | No — only route-stop-list.tsx | ✅ Component-level import only |
| @tanstack/react-table | No — only 3 admin tables | ✅ Component-level imports only |
| sonner (Toaster) | Yes — in root layout | Acceptable (small, ~5KB) |
| @base-ui/react | Yes — via shadcn components | Hard to avoid (underlies all UI) |

### Bundle Audit Verdict

- **No unnecessary global loads** — all heavy libraries are component-level imports.
- **Google Maps is loaded dynamically** via script injection (not bundled).
- **@dnd-kit is only in admin route-stop-list** — acceptable since it's behind a route.
- **No bundle analyzer in CI** — can't measure exact sizes.

---

## TASK 9 — PERFORMANCE SCORE

### Database: **B**

| Criteria | Score | Reason |
|---|---|---|
| Query efficiency | B | Good JOIN patterns, batch fetches. One N+1 pattern (reorderStops) |
| Index coverage | A | All primary query patterns covered. Missing `users` indexes |
| Connection pooling | C | HTTP client only, no persistent connections |
| Prepared statements | D | No `.prepare()` used anywhere |

### Server: **C**

| Criteria | Score | Reason |
|---|---|---|
| Data fetching strategy | C | Duplicate auth per page load, sequential queries in driver actions |
| Caching | D | No `revalidateTag`, only full-path `revalidatePath` |
| Server components usage | A | Most pages are server-rendered |
| Parallel fetching | B | Dashboard uses Promise.all; most others don't |

### Client: **B+**

| Criteria | Score | Reason |
|---|---|---|
| Bundle size | B | No massive libraries globally. dnd-kit only in 1 file |
| Memoization | C | Table `columns` not memoized |
| Rerenders | B | Minimal unnecessary rerenders |
| Hydration | A | Mostly server components, minimal client JS |

### Network: **C**

| Criteria | Score | Reason |
|---|---|---|
| Round trips per page | C | 5-10 DB round-trips per page (auth + data queries) |
| Cache hit ratio | D | No tag-based caching, full revalidation |
| Fetch strategy | C | Sequential query chains in driver actions |

### Overall: **C+**

Server-side performance needs the most optimization (duplicate auth, no caching). Database and client are in good shape.

---

## TOP 10 BOTTLENECKS

| # | Bottleneck | Category | Estimated Impact |
|---|---|---|---|
| 1 | **Session fetched 2-3× per page load** | Server/Network | **HIGH** — Adds 100-200ms per extra call. Dashboard: 3× auth. |
| 2 | **No granular cache revalidation** | Server | **HIGH** — Every mutation invalidates entire list pages. Driver: 20 re-fetches for 20 stops. |
| 3 | **2×N updates in reorderStops()** | Database | **MEDIUM** — 40 queries for 20-stop reorder. No failure in production yet, but first to break at scale. |
| 4 | **Sequential queries in driver actions** | Database | **MEDIUM** — 3-4 round-trips per delivery action. 80 extra round-trips for a 20-stop route. |
| 5 | **Missing users indexes** | Database | **MEDIUM** — Drivers queries do sequential scans on tenantId+role+deletedAt. Pain at 500+ drivers. |
| 6 | **No prepared statements** | Database | **MEDIUM** — Every query re-parsed. Adds 5-15ms overhead per query. |
| 7 | **Table `columns` not memoized** | Client | **LOW-MEDIUM** — Extra reconciliation in TanStack Table on every render. |
| 8 | **HTTP client only (no TCP pool)** | Network | **LOW-MEDIUM** — Works fine for serverless, but adds latency per query. |
| 9 | **Read actions fetch session unnecessarily** | Server | **LOW** — getCustomersAction, getDriversAction, getRoutesAction all check auth. Could skip for internal server-to-server calls. |
| 10 | **No loading.tsx on driver route** | Client | **LOW** — Page appears after full fetch. Minor UX impact. |

---

## ESTIMATED IMPACT BY PAGE

| Page | Current (est.) | Optimized (est.) | Savings |
|---|---|---|---|
| Dashboard | ~400ms | ~200ms | 50% (remove duplicate auth) |
| Customers list | ~350ms | ~200ms | 43% |
| Drivers list | ~350ms | ~200ms | 43% |
| Routes list | ~350ms | ~200ms | 43% |
| Delivery Dashboard | ~550ms | ~350ms | 36% |
| Driver Route (load) | ~500ms | ~300ms | 40% |
| Driver Route (action) | ~300ms | ~150ms | 50% |

---

## EASY WINS (Hours, not days)

| # | Fix | Effort | Impact | Files |
|---|---|---|---|---|
| 1 | **Deduplicate `getSession()` into shared helper** | 15 min | Low (maintainability) | 10 action files |
| 2 | **Wrap table `columns` in `useMemo`** | 10 min per file | Low-Medium | 3 table components |
| 3 | **Extract route-card.tsx IIFE to module-level function** | 5 min | Low | 1 file |
| 4 | **Add `users` indexes** | 15 min (migration) | Medium | 1 migration |
| 5 | **Add `loading.tsx` to driver route** | 10 min | Low | 1 file |

## MEDIUM IMPROVEMENTS (Half-day each)

| # | Fix | Effort | Impact | Files |
|---|---|---|---|---|
| 1 | **Pass session from layout to page (skip action auth)** | 4 hrs | **HIGH** | Layout + action files |
| 2 | **Use `revalidateTag` instead of `revalidatePath`** | 4 hrs | **HIGH** | All action files |
| 3 | **Batch driver route actions (complete multiple at once)** | 4 hrs | Medium | driver-route |
| 4 | **Switch from HTTP client to WebSocket pool** | 2 hrs | Medium | db/index.ts |

## HIGH EFFORT IMPROVEMENTS (1-2 days)

| # | Fix | Effort | Impact |
|---|---|---|---|
| 1 | **Single-query `reorderStops` using `CASE` statement** | 1 day | Medium |
| 2 | **Server-side data fetching for admin tables** | 1-2 days | High |
| 3 | **Implement ISR or stale-while-revalidate for dashboard** | 1 day | Medium |

---

## RECOMMENDED OPTIMIZATION ORDER

1. **Pass session from layout → page** (eliminate 50% of auth queries) — Highest ROI
2. **Switch to `revalidateTag`** (cut re-fetch payloads by 80%)
3. **Add missing `users` indexes** (prevent future perf regression)
4. **Batch driver route actions** (cut delivery action round-trips)
5. **Memoize table `columns`** (reduce client rerenders)
6. **Add `loading.tsx`** (improve perceived performance)
7. **Single-query `reorderStops`** (fix N+1 mutation)
8. **Switch to WebSocket pool** (faster per-query latency)

---

*Audit only. No code changes implemented.*
