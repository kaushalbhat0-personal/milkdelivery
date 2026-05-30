# Mobile UX Audit

Audit of the driver workflow on mobile devices.

## Test Environment

- Viewport: 375×667 (iPhone SE)
- Framework: Tailwind CSS with shadcn/ui components

---

## Findings

### 1. Tap Targets

| Element | Size | Min Recommended | Verdict |
|---|---|---|---|
| Deliver button | `h-9` (36px) | 44px | ⚠️ Below minimum |
| Skip button | `h-9` (36px) | 44px | ⚠️ Below minimum |
| Not Required button | `h-9` (36px) | 44px | ⚠️ Below minimum |
| Skip Reason buttons | `p-3` (~48px) | 44px | ✅ Adequate |
| Phone link | text with icon | 44px | ⚠️ Not a dedicated button |
| Confirm in dialog | Button | 44px | ⚠️ May be below min |
| Cancel in dialog | Button | 44px | ⚠️ May be below min |

**Recommendation:** Increase button sizing to `h-10` or `h-11` for action buttons to meet the 44px minimum tap target. Alternatively, use a stacked layout instead of 3 buttons side-by-side.

### 2. Loading States

| State | Current Behavior | Verdict |
|---|---|---|
| Delivery action pending | Button disabled, shows "Saving..." | ✅ Clear |
| Skip action pending | Buttons disabled | ✅ Clear |
| Page load | Server component, no loading UI | ⚠️ Page appears after full load |
| Route optimization pending | Button shows spinner | ✅ Clear |

**Recommendation:** Add `loading.tsx` to the driver route page for skeleton loading.

### 3. Long Customer Names

The `truncate` utility class is applied to customer names. This prevents overflow but hides the full name.

**Recommendation:** Consider multi-line wrapping with `line-clamp-2` for customer names instead of single-line truncation. Drivers need to see the full name when making deliveries.

### 4. Long Addresses

Same as names — `truncate` is applied. Addresses can be long in India (e.g., "House No. 123, Sector 45, Near Gurudwara, Phase 2").

**Recommendation:** No change needed — the full address is visible on the card body (not truncated there), only the header line truncates.

### 5. Slow Network

The driver page is a server component (`force-dynamic`). It fetches data before rendering. On slow networks, the page will take time to load with no intermediate UI.

**Recommendation:** Add `loading.tsx` at `src/app/(driver)/route/loading.tsx` with a skeleton spinner.

### 6. Phone Action

The phone number is a text link (`<a href="tel:...">`). On mobile, this triggers the phone dialer.

**Recommendation:** Make the phone number a dedicated button with a phone icon, styled similarly to action buttons, for easier tapping.

### 7. Card Layout

Cards use `CardContent` with `space-y-3`. On very small screens (320px), the 3 action buttons in `CardFooter` with `flex gap-2` may overflow.

**Recommendation:** Change to `flex-col` on small screens or use font-size-based wrapping.

### 8. Quantity Badge

The quantity badge shows prominently next to the customer name. This is good for quick identification.

**Recommendation:** ✅ No change needed. Current implementation is effective.

### 9. Color Coding

Delivery status card backgrounds are color-coded:
- Delivered: green border/background
- Skipped: amber border/background  
- Not Required: muted border/background

**Recommendation:** ✅ Effective. No change needed.

### 10. Dialog UX

Skip and note dialogs use `DialogContent` which covers the screen. On mobile, dialogs can be large — the skip dialog with 5 reason buttons plus a notes input field may require scrolling.

**Recommendation:** Consider reducing to a `Sheet` (bottom drawer) on mobile for better one-handed use, or use smaller dialog sizing.
