import { pgTable, uuid, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { routes } from "./routes";
import { customers } from "./customers";

export const routeStops = pgTable("route_stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  routeId: uuid("route_id")
    .notNull()
    .references(() => routes.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("stops_route_sort_uniq").on(table.routeId, table.sortOrder),
  uniqueIndex("stops_route_customer_uniq").on(table.routeId, table.customerId),
  index("stops_tenant_route_idx").on(table.tenantId, table.routeId),
  index("stops_tenant_deleted_idx").on(table.tenantId, table.deletedAt),
]);

export type RouteStop = typeof routeStops.$inferSelect;
export type NewRouteStop = typeof routeStops.$inferInsert;
