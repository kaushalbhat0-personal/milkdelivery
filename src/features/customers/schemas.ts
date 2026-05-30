import { z } from "zod";

const customerFields = {
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(20).optional(),
  address: z.string().min(1, "Address is required"),
  placeId: z.string().optional(),
  formattedAddress: z.string().optional(),
  landmark: z.string().optional(),
  notes: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isActive: z.boolean(),
} as const;

function requireCoordinates<T extends { address?: string; placeId?: string; latitude?: number; longitude?: number }>(
  data: T,
  ctx: z.RefinementCtx
) {
  if (!data.address) return;
  const hasPlaceId = !!data.placeId;
  const hasLat = data.latitude !== undefined;
  const hasLng = data.longitude !== undefined;
  if (!hasPlaceId && (!hasLat || !hasLng)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select a valid address from suggestions or provide coordinates",
      path: ["address"],
    });
  }
}

export const createCustomerSchema = z.object(customerFields).superRefine(requireCoordinates);

export type CreateCustomerInput = {
  name: string;
  phone?: string;
  address: string;
  placeId?: string;
  formattedAddress?: string;
  landmark?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
};

export const updateCustomerSchema = z.object(customerFields).partial().superRefine(requireCoordinates);

export const customerSearchSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type UpdateCustomerInput = Partial<CreateCustomerInput>;
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>;
