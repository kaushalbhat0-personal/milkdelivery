import { z } from "zod";

export const createRouteSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  zone: z.string().optional(),
  driverId: z.string().optional().nullable().transform(val => val === "" ? null : val),
});

export const updateRouteSchema = createRouteSchema.partial();

export const assignDriverSchema = z.object({
  driverId: z.string().uuid("Invalid driver ID"),
});

export const addCustomerToRouteSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
});

export const removeCustomerFromRouteSchema = z.object({
  stopId: z.string().uuid("Invalid stop ID"),
});

export const reorderStopsSchema = z.object({
  stopIds: z.array(z.string().uuid()).min(1, "At least one stop required"),
});

export const routeSearchSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
export type AddCustomerToRouteInput = z.infer<typeof addCustomerToRouteSchema>;
export type RemoveCustomerFromRouteInput = z.infer<typeof removeCustomerFromRouteSchema>;
export type ReorderStopsInput = z.infer<typeof reorderStopsSchema>;
export type RouteSearchInput = z.infer<typeof routeSearchSchema>;
