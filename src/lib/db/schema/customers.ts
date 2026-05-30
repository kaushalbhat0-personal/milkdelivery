import { pgTable, uuid, varchar, text, decimal, boolean, timestamp, date, index } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { users } from "./auth";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address").notNull(),
  landmark: text("landmark"),
  notes: text("notes"),
  placeId: varchar("place_id", { length: 255 }),
  formattedAddress: text("formatted_address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  housePhotoUrl: varchar("house_photo_url", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  deliveryType: varchar("delivery_type", { length: 20 }).default("DAILY").notNull(),
  quantity: decimal("quantity", { precision: 5, scale: 2 }).default("1").notNull(),
  unit: varchar("unit", { length: 10 }).default("LITER").notNull(),
  deliveryDays: text("delivery_days").array(),
  pauseFrom: date("pause_from"),
  pauseUntil: date("pause_until"),
  deliveryStartDate: date("delivery_start_date"),
  createdBy: text("created_by").references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("customers_tenant_active_idx").on(table.tenantId, table.isActive),
  index("customers_tenant_name_idx").on(table.tenantId, table.name),
  index("customers_tenant_deleted_idx").on(table.tenantId, table.deletedAt),
  index("customers_tenant_phone_idx").on(table.tenantId, table.phone),
  index("customers_tenant_address_idx").on(table.tenantId, table.address),
  index("customers_delivery_type_idx").on(table.tenantId, table.deliveryType),
]);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
