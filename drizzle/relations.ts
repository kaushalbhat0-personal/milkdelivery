import { relations } from "drizzle-orm/relations";
import { users, sessions, accounts, tenants, routes, deliveryLogs, routeStops, customers } from "./schema";

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	sessions: many(sessions),
	accounts: many(accounts),
	routes_driverId: many(routes, {
		relationName: "routes_driverId_users_id"
	}),
	routes_createdBy: many(routes, {
		relationName: "routes_createdBy_users_id"
	}),
	routes_updatedBy: many(routes, {
		relationName: "routes_updatedBy_users_id"
	}),
	deliveryLogs: many(deliveryLogs),
	customers_createdBy: many(customers, {
		relationName: "customers_createdBy_users_id"
	}),
	customers_updatedBy: many(customers, {
		relationName: "customers_updatedBy_users_id"
	}),
	tenant: one(tenants, {
		fields: [users.tenantId],
		references: [tenants.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const routesRelations = relations(routes, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [routes.tenantId],
		references: [tenants.id]
	}),
	user_driverId: one(users, {
		fields: [routes.driverId],
		references: [users.id],
		relationName: "routes_driverId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [routes.createdBy],
		references: [users.id],
		relationName: "routes_createdBy_users_id"
	}),
	user_updatedBy: one(users, {
		fields: [routes.updatedBy],
		references: [users.id],
		relationName: "routes_updatedBy_users_id"
	}),
	routeStops: many(routeStops),
}));

export const tenantsRelations = relations(tenants, ({many}) => ({
	routes: many(routes),
	deliveryLogs: many(deliveryLogs),
	routeStops: many(routeStops),
	customers: many(customers),
	users: many(users),
}));

export const deliveryLogsRelations = relations(deliveryLogs, ({one}) => ({
	tenant: one(tenants, {
		fields: [deliveryLogs.tenantId],
		references: [tenants.id]
	}),
	routeStop: one(routeStops, {
		fields: [deliveryLogs.routeStopId],
		references: [routeStops.id]
	}),
	user: one(users, {
		fields: [deliveryLogs.driverId],
		references: [users.id]
	}),
}));

export const routeStopsRelations = relations(routeStops, ({one, many}) => ({
	deliveryLogs: many(deliveryLogs),
	tenant: one(tenants, {
		fields: [routeStops.tenantId],
		references: [tenants.id]
	}),
	route: one(routes, {
		fields: [routeStops.routeId],
		references: [routes.id]
	}),
	customer: one(customers, {
		fields: [routeStops.customerId],
		references: [customers.id]
	}),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	routeStops: many(routeStops),
	tenant: one(tenants, {
		fields: [customers.tenantId],
		references: [tenants.id]
	}),
	user_createdBy: one(users, {
		fields: [customers.createdBy],
		references: [users.id],
		relationName: "customers_createdBy_users_id"
	}),
	user_updatedBy: one(users, {
		fields: [customers.updatedBy],
		references: [users.id],
		relationName: "customers_updatedBy_users_id"
	}),
}));