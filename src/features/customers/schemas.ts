import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(20).optional(),
  address: z.string().min(1, "Address is required"),
  landmark: z.string().optional(),
  notes: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isActive: z.boolean(),
});

export type CreateCustomerInput = {
  name: string;
  phone?: string;
  address: string;
  landmark?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
};

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerSearchSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type UpdateCustomerInput = Partial<CreateCustomerInput>;
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>;
