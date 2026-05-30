# Driver Guide

## Overview

The driver route page shows your assigned route for today, with only the customers who need milk today based on their delivery plan.

## Accessing Your Route

1. Go to the login page at `/login`
2. Sign in with your driver credentials
3. You will see your assigned route at `/route`

## Route Page

### Header

The header shows:

- **Route name** — e.g., "Morning Route - Zone A"
- **Zone** — the area you're delivering to
- **Your name**
- **Stops today** — number of customers who need milk today
- **Total quantity** — total liters/ml to deliver

### Stop Cards

Each customer card shows:

- **Stop number** (e.g., 1 of 14)
- **Customer name**
- **Quantity** — prominently displayed (e.g., **2 L**, **500 ML**, **1.5 L**)
- **Address**
- **Phone number** — tap to call
- **Landmark** and **notes**
- **House photo** (if available)

### Action Buttons

For each undelivered stop:

| Button | When to Use |
|---|---|
| **Deliver** | You delivered the milk |
| **Skip** | Customer not home, no container, etc. |
| **Not Required** | Customer doesn't need milk today (already communicated) |

### Skip Reasons

When skipping, you'll be asked to select a reason:

- Customer Not Home
- No Container Outside
- Milk Not Required
- Wrong Address
- Other (specify in notes)

### Adding Notes

You can add optional notes when completing or skipping a delivery.

### Optimize Route

The **Optimize Route** button reorders your stops by nearest distance from your current location. Tap it after arriving at your first stop for the most efficient route.

### Finish Route

Tap **Finish Route** after all stops are done. The route completion is recorded and the admin dashboard will show the route as completed.

## What You See vs What Drivers Don't See

**You see:** Only customers who need milk today

**You don't see:**
- Customers on vacation hold (paused)
- Customers whose alternate-day schedule is an off day
- Customers whose custom weekday schedule doesn't include today
- Customers assigned to other routes

## Troubleshooting

### "No Route Assigned"

If you see this message:

- Your admin has not assigned you to a route yet
- The route assigned to you may be inactive
- Contact your administrator

### "Route Completed"

If you see this message, you've already finished this route today. Check with your admin if you need to make additional deliveries.

### Can't Find a Stop

The stops are ordered for efficiency. If the GPS coordinates are available, use the **Optimize Route** button to reorder stops by nearest distance from your current location.

### Delivery Log Not Updating

If a delivery action seems to fail:

1. Check your internet connection
2. Try again
3. If it persists, note the customer details and inform your admin
