import { pgTable, uuid, varchar, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./auth";

export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  zone: varchar("zone", { length: 255 }),
  driverId: text("driver_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: text("created_by").references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("routes_tenant_active_idx").on(table.tenantId, table.isActive),
  index("routes_tenant_driver_idx").on(table.tenantId, table.driverId),
  index("routes_tenant_deleted_idx").on(table.tenantId, table.deletedAt),
  uniqueIndex("routes_tenant_driver_active_uniq")
    .on(table.tenantId, table.driverId)
    .where(
      sql`${table.isActive} = true AND ${table.deletedAt} IS NULL`
    ),
]);

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
