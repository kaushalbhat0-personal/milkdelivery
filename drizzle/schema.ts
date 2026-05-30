import { pgTable, foreignKey, unique, text, timestamp, uuid, varchar, index, uniqueIndex, boolean, date, integer, numeric, serial, bigint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	impersonatedBy: text("impersonated_by"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_token_unique").on(table.token),
]);

export const tenants = pgTable("tenants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("tenants_slug_unique").on(table.slug),
]);

export const verifications = pgTable("verifications", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
});

export const accounts = pgTable("accounts", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const routes = pgTable("routes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	zone: varchar({ length: 255 }),
	driverId: text("driver_id"),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: text("created_by"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("routes_tenant_active_idx").using("btree", table.tenantId.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("routes_tenant_deleted_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("routes_tenant_driver_active_uniq").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.driverId.asc().nullsLast().op("text_ops")).where(sql`((is_active = true) AND (deleted_at IS NULL))`),
	index("routes_tenant_driver_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.driverId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "routes_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.driverId],
			foreignColumns: [users.id],
			name: "routes_driver_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "routes_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "routes_updated_by_users_id_fk"
		}),
]);

export const deliveryLogs = pgTable("delivery_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	routeStopId: uuid("route_stop_id").notNull(),
	driverId: text("driver_id").notNull(),
	deliveryDate: date("delivery_date").notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("logs_driver_date_idx").using("btree", table.driverId.asc().nullsLast().op("text_ops"), table.deliveryDate.asc().nullsLast().op("date_ops")),
	index("logs_stop_date_idx").using("btree", table.routeStopId.asc().nullsLast().op("date_ops"), table.deliveryDate.asc().nullsLast().op("date_ops")),
	index("logs_tenant_date_idx").using("btree", table.tenantId.asc().nullsLast().op("date_ops"), table.deliveryDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "delivery_logs_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.routeStopId],
			foreignColumns: [routeStops.id],
			name: "delivery_logs_route_stop_id_route_stops_id_fk"
		}),
	foreignKey({
			columns: [table.driverId],
			foreignColumns: [users.id],
			name: "delivery_logs_driver_id_users_id_fk"
		}),
]);

export const routeStops = pgTable("route_stops", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	routeId: uuid("route_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	sortOrder: integer("sort_order").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("stops_route_customer_uniq").using("btree", table.routeId.asc().nullsLast().op("uuid_ops"), table.customerId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("stops_route_sort_uniq").using("btree", table.routeId.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("uuid_ops")),
	index("stops_tenant_deleted_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.deletedAt.asc().nullsLast().op("uuid_ops")),
	index("stops_tenant_route_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.routeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "route_stops_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.routeId],
			foreignColumns: [routes.id],
			name: "route_stops_route_id_routes_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "route_stops_customer_id_customers_id_fk"
		}),
]);

export const customers = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	address: text().notNull(),
	landmark: text(),
	notes: text(),
	latitude: numeric({ precision: 10, scale:  7 }),
	longitude: numeric({ precision: 10, scale:  7 }),
	housePhotoUrl: varchar("house_photo_url", { length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: text("created_by"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	placeId: varchar("place_id", { length: 255 }),
	formattedAddress: text("formatted_address"),
}, (table) => [
	index("customers_tenant_active_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.isActive.asc().nullsLast().op("uuid_ops")),
	index("customers_tenant_address_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.address.asc().nullsLast().op("uuid_ops")),
	index("customers_tenant_deleted_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.deletedAt.asc().nullsLast().op("uuid_ops")),
	index("customers_tenant_name_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.name.asc().nullsLast().op("uuid_ops")),
	index("customers_tenant_phone_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.phone.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "customers_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "customers_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "customers_updated_by_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	tenantId: uuid("tenant_id").notNull(),
	role: text().default('user').notNull(),
	phone: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	banned: boolean().default(false).notNull(),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "users_tenant_id_tenants_id_fk"
		}),
	unique("users_email_unique").on(table.email),
]);

export const drizzleMigrations = pgTable("__drizzle_migrations", {
	id: serial().primaryKey().notNull(),
	hash: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }),
});
