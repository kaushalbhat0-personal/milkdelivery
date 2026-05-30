import { neon } from "@neondatabase/serverless";

async function audit() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

  const sql = neon(url);
  const issues: string[] = [];

  console.log("\n═══════════════════════════════════════");
  console.log("  DATA INTEGRITY AUDIT");
  console.log("═══════════════════════════════════════\n");

  // ─── 1. Orphan route_stops ──────────────────────────────
  console.log("── 1. Orphan route_stops ──");
  const [orphanStops] = await sql`
    SELECT COUNT(*)::int AS count
    FROM route_stops rs
    LEFT JOIN routes r ON r.id = rs.route_id
    WHERE r.id IS NULL
  `;
  if (orphanStops.count > 0) {
    issues.push(`Found ${orphanStops.count} orphan route_stops (no matching route)`);
    console.error(`  ❌ ${orphanStops.count} orphan route_stops found`);
  } else {
    console.log("  ✅ No orphan route_stops");
  }

  // ─── 2. Orphan delivery_logs ────────────────────────────
  console.log("\n── 2. Orphan delivery_logs ──");
  const [orphanLogs] = await sql`
    SELECT COUNT(*)::int AS count
    FROM delivery_logs dl
    LEFT JOIN route_stops rs ON rs.id = dl.route_stop_id
    WHERE rs.id IS NULL
  `;
  if (orphanLogs.count > 0) {
    issues.push(`Found ${orphanLogs.count} orphan delivery_logs (no matching route_stop)`);
    console.error(`  ❌ ${orphanLogs.count} orphan delivery_logs found`);
  } else {
    console.log("  ✅ No orphan delivery_logs");
  }

  // ─── 3. Duplicate active route assignments ─────────────
  console.log("\n── 3. Duplicate active route assignments ──");
  const dupAssignments = await sql`
    SELECT driver_id, COUNT(*)::int AS cnt
    FROM routes
    WHERE is_active = true AND deleted_at IS NULL AND driver_id IS NOT NULL
    GROUP BY driver_id
    HAVING COUNT(*) > 1
  `;
  if (dupAssignments.length > 0) {
    for (const d of dupAssignments) {
      issues.push(`Driver ${d.driver_id} has ${d.cnt} active routes`);
    }
    console.error(`  ❌ ${dupAssignments.length} drivers have duplicate active routes`);
    for (const d of dupAssignments) {
      console.error(`     Driver ${d.driver_id}: ${d.cnt} active routes`);
    }
  } else {
    console.log("  ✅ No duplicate active route assignments");
  }

  // ─── 4. Duplicate customer in same route ───────────────
  console.log("\n── 4. Duplicate customer in same route ──");
  const dupCustomers = await sql`
    SELECT route_id, customer_id, COUNT(*)::int AS cnt
    FROM route_stops
    WHERE deleted_at IS NULL
    GROUP BY route_id, customer_id
    HAVING COUNT(*) > 1
  `;
  if (dupCustomers.length > 0) {
    for (const d of dupCustomers) {
      issues.push(`Customer ${d.customer_id} appears ${d.cnt}x in route ${d.route_id}`);
    }
    console.error(`  ❌ ${dupCustomers.length} duplicate customer-route pairs found`);
  } else {
    console.log("  ✅ No duplicate customers in same route");
  }

  // ─── 5. Customers in multiple active routes ────────────
  console.log("\n── 5. Customers assigned to multiple active routes ──");
  const multiRouteCustomers = await sql`
    SELECT rs.customer_id, COUNT(DISTINCT rs.route_id)::int AS route_count
    FROM route_stops rs
    INNER JOIN routes r ON r.id = rs.route_id
    WHERE r.is_active = true AND r.deleted_at IS NULL AND rs.deleted_at IS NULL
    GROUP BY rs.customer_id
    HAVING COUNT(DISTINCT rs.route_id) > 1
    LIMIT 20
  `;
  if (multiRouteCustomers.length > 0) {
    issues.push(`${multiRouteCustomers.length}+ customers assigned to multiple active routes (showing first ${multiRouteCustomers.length})`);
    console.error(`  ❌ ${multiRouteCustomers.length}+ customers in multiple active routes`);
    for (const c of multiRouteCustomers) {
      console.error(`     Customer ${c.customer_id}: ${c.route_count} routes`);
    }
  } else {
    console.log("  ✅ No customers in multiple active routes");
  }

  // ─── 6. Invalid delivery types ─────────────────────────
  console.log("\n── 6. Invalid delivery types ──");
  const [invalidTypes] = await sql`
    SELECT COUNT(*)::int AS count
    FROM customers
    WHERE delivery_type NOT IN ('DAILY', 'ALTERNATE_DAYS', 'CUSTOM_DAYS', 'PAUSED')
  `;
  if (invalidTypes.count > 0) {
    issues.push(`Found ${invalidTypes.count} customers with invalid delivery_type`);
    console.error(`  ❌ ${invalidTypes.count} invalid delivery types`);
  } else {
    console.log("  ✅ All delivery types valid");
  }

  // ─── 7. ALTERNATE_DAYS without delivery_start_date ─────
  console.log("\n── 7. ALTERNATE_DAYS without delivery_start_date ──");
  const [missingStart] = await sql`
    SELECT COUNT(*)::int AS count
    FROM customers
    WHERE delivery_type = 'ALTERNATE_DAYS' AND delivery_start_date IS NULL AND deleted_at IS NULL
  `;
  if (missingStart.count > 0) {
    issues.push(`${missingStart.count} ALTERNATE_DAYS customers missing delivery_start_date`);
    console.error(`  ❌ ${missingStart.count} ALTERNATE_DAYS customers without start date`);
  } else {
    console.log("  ✅ All ALTERNATE_DAYS customers have delivery_start_date");
  }

  // ─── 8. CUSTOM_DAYS with empty delivery_days ───────────
  console.log("\n── 8. CUSTOM_DAYS with empty delivery_days ──");
  const [emptyDays] = await sql`
    SELECT COUNT(*)::int AS count
    FROM customers
    WHERE delivery_type = 'CUSTOM_DAYS'
      AND (delivery_days IS NULL OR delivery_days = '{}')
      AND deleted_at IS NULL
  `;
  if (emptyDays.count > 0) {
    issues.push(`${emptyDays.count} CUSTOM_DAYS customers have no delivery days configured`);
    console.error(`  ❌ ${emptyDays.count} CUSTOM_DAYS customers without delivery days`);
  } else {
    console.log("  ✅ All CUSTOM_DAYS customers have delivery days configured");
  }

  // ─── 9. Null quantities ─────────────────────────────────
  console.log("\n── 9. Customers with null/zero quantity ──");
  const [nullQty] = await sql`
    SELECT COUNT(*)::int AS count
    FROM customers
    WHERE (quantity IS NULL OR quantity::numeric = 0) AND deleted_at IS NULL
  `;
  if (nullQty.count > 0) {
    issues.push(`${nullQty.count} customers have null or zero quantity`);
    console.error(`  ❌ ${nullQty.count} customers with null/zero quantity`);
  } else {
    console.log("  ✅ All customers have valid quantity");
  }

  // ─── 10. Inactive customers in active routes ───────────
  console.log("\n── 10. Inactive customers in active routes ──");
  const [inactiveInRoutes] = await sql`
    SELECT COUNT(*)::int AS count
    FROM route_stops rs
    INNER JOIN customers c ON c.id = rs.customer_id
    INNER JOIN routes r ON r.id = rs.route_id
    WHERE (c.is_active = false OR c.deleted_at IS NOT NULL)
      AND r.is_active = true AND r.deleted_at IS NULL
      AND rs.deleted_at IS NULL
  `;
  if (inactiveInRoutes.count > 0) {
    issues.push(`${inactiveInRoutes.count} inactive/deleted customers in active routes`);
    console.error(`  ❌ ${inactiveInRoutes.count} inactive/deleted customers in active routes`);
  } else {
    console.log("  ✅ No inactive customers in active routes");
  }

  // ─── Summary ───────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  console.log("  AUDIT SUMMARY");
  console.log("═══════════════════════════════════════");
  if (issues.length === 0) {
    console.log("  ✅ No data integrity issues found");
  } else {
    console.error(`  ❌ ${issues.length} issue(s) found:\n`);
    for (const issue of issues) {
      console.error(`     • ${issue}`);
    }
  }
  console.log();
}

audit().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
