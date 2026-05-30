# Admin Guide

## Overview

The milk delivery platform enables administrators to manage customers, drivers, routes, and daily delivery operations.

## Getting Started

1. Navigate to the login page at `/login`
2. Sign in with your admin credentials
3. You will land on the dashboard at `/dashboard`

## Dashboard

The dashboard shows:

- **Total active customers** — all non-deleted customers
- **Active drivers** — non-deleted drivers
- **Active routes** — non-deleted routes
- **Today's deliveries** — pending, delivered, skipped

### Delivery Dashboard (`/delivery`)

Shows today's delivery metrics:

- **Today's Metrics** — total eligible stops, delivered, skipped, not required, pending
- **Per-driver summary** — each driver's assigned stops and progress
- **Per-route summary** — each route's completion status

Metrics only count **eligible** customers (those who should receive milk today based on their delivery plan).

## Customers

### Customer List (`/customers`)

- Search by name, phone, or address
- Paginated table with edit and delete actions
- Create new customers via the **New Customer** button

### Customer Delivery Plan

Each customer has a delivery plan:

| Type | Behavior |
|---|---|
| **Daily** | Receives milk every day |
| **Alternate Days** | Receives milk every other day from the start date |
| **Custom Days** | Receives milk only on selected weekdays (Mon/Wed/Fri, etc.) |
| **Paused** | Temporarily stopped — excluded from driver routes, optimization, and dashboard |

### Vacation Hold

To pause a customer's deliveries:

1. Edit the customer
2. Set **Delivery Type** to **Paused**
3. Set **Pause From** (required) and **Pause Until** (optional)
4. Save

While paused, the customer will not appear on any driver's route, in route optimization, or in the delivery dashboard.

## Drivers

### Driver List (`/drivers`)

- View all drivers
- Create new drivers (these are user accounts)
- Assign drivers to routes from the route edit page

## Routes

### Route List (`/routes`)

- Search by name or zone
- Create new routes
- Edit route details, assign driver, manage stops

### Route Detail (`/routes/[id]`)

Shows:

- **Route Details** — name, description, zone, driver assignment
- **Today's Delivery Summary** — eligible customers count, total quantity, breakdown by quantity
- **Route Stops** — drag-and-drop reordering, add/remove customers

### Route Summary

The route summary shows:

- **Customers Today** — number of eligible customers (based on delivery plans)
- **Total Quantity** — total liters to deliver today
- **Breakdown** — how many customers get each quantity (e.g., 1L: 12, 500ml: 8, 2L: 3)

## Exports

Export data as CSV from the following API endpoints (admin only):

| Export | Endpoint |
|---|---|
| Customers | `GET /api/exports/customers` |
| Delivery Logs | `GET /api/exports/delivery-logs` |
| Routes | `GET /api/exports/routes` |

All exports are tenant-scoped — only data belonging to your organization is included.

## Architecture

The application follows a strict layering pattern:

```
Page (UI only)
  ↓
Action (auth + validation + revalidation)
  ↓
Service (business logic)
  ↓
Query (database access)
```

- Pages never access the database directly
- Business logic lives in service files, never in components
- Queries only fetch/update data — no business rules
