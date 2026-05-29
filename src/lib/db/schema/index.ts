import { relations } from "drizzle-orm";

import { tenants } from "./tenants";
import { users, sessions, accounts, verifications } from "./auth";
import { customers } from "./customers";
import { routes } from "./routes";
import { routeStops } from "./route-stops";
import { deliveryLogs } from "./delivery-logs";

export { tenants };
export type { Tenant, NewTenant } from "./tenants";

export { users, sessions, accounts, verifications };
export type { User, NewUser } from "./auth";

export { customers };
export type { Customer, NewCustomer } from "./customers";

export { routes };
export type { Route, NewRoute } from "./routes";

export { routeStops };
export type { RouteStop, NewRouteStop } from "./route-stops";

export { deliveryLogs };
export type { DeliveryLog, NewDeliveryLog } from "./delivery-logs";

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  routes: many(routes),
  routeStops: many(routeStops),
  deliveryLogs: many(deliveryLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  sessions: many(sessions),
  accounts: many(accounts),
  routes: many(routes),
  deliveryLogs: many(deliveryLogs),
  createdCustomers: many(customers, { relationName: "customerCreatedBy" }),
  updatedCustomers: many(customers, { relationName: "customerUpdatedBy" }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(users, {
    fields: [customers.createdBy],
    references: [users.id],
    relationName: "customerCreatedBy",
  }),
  updatedByUser: one(users, {
    fields: [customers.updatedBy],
    references: [users.id],
    relationName: "customerUpdatedBy",
  }),
  routeStops: many(routeStops),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [routes.tenantId],
    references: [tenants.id],
  }),
  driver: one(users, {
    fields: [routes.driverId],
    references: [users.id],
  }),
  routeStops: many(routeStops),
}));

export const routeStopsRelations = relations(routeStops, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [routeStops.tenantId],
    references: [tenants.id],
  }),
  route: one(routes, {
    fields: [routeStops.routeId],
    references: [routes.id],
  }),
  customer: one(customers, {
    fields: [routeStops.customerId],
    references: [customers.id],
  }),
  deliveryLogs: many(deliveryLogs),
}));

export const deliveryLogsRelations = relations(deliveryLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [deliveryLogs.tenantId],
    references: [tenants.id],
  }),
  routeStop: one(routeStops, {
    fields: [deliveryLogs.routeStopId],
    references: [routeStops.id],
  }),
  driver: one(users, {
    fields: [deliveryLogs.driverId],
    references: [users.id],
  }),
}));
