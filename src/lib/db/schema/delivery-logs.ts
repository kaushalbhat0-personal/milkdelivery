import { pgTable, uuid, text, date, timestamp, index } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { routeStops } from "./route-stops";
import { users } from "./auth";

export const deliveryLogs = pgTable("delivery_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  routeStopId: uuid("route_stop_id")
    .notNull()
    .references(() => routeStops.id),
  driverId: text("driver_id")
    .notNull()
    .references(() => users.id),
  deliveryDate: date("delivery_date").notNull(),
  status: text("status").notNull().default("PENDING"),
  skipReason: text("skip_reason"),
  notes: text("notes"),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("logs_stop_date_idx").on(table.routeStopId, table.deliveryDate),
  index("logs_driver_date_idx").on(table.driverId, table.deliveryDate),
  index("logs_tenant_date_idx").on(table.tenantId, table.deliveryDate),
  index("logs_status_date_idx").on(table.status, table.deliveryDate),
]);

export type DeliveryLog = typeof deliveryLogs.$inferSelect;
export type NewDeliveryLog = typeof deliveryLogs.$inferInsert;
