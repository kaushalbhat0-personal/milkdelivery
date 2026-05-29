import { z } from "zod";

export const createDriverSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
});

export const updateDriverSchema = createDriverSchema.partial();

export const driverSearchSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type DriverSearchInput = z.infer<typeof driverSearchSchema>;
