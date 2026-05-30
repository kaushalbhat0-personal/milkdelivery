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
  deliveryType: z.enum(["DAILY", "ALTERNATE_DAYS", "CUSTOM_DAYS", "PAUSED"]).default("DAILY"),
  quantity: z.coerce.number().positive("Quantity must be positive").max(999.99).default(1),
  unit: z.enum(["LITER", "ML"]).default("LITER"),
  deliveryDays: z.array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])).optional(),
  pauseFrom: z.string().optional(),
  pauseUntil: z.string().optional(),
  deliveryStartDate: z.string().optional(),
} as const;

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

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

function validateDeliveryPlan(
  data: { deliveryType?: string; deliveryDays?: string[]; pauseFrom?: string; pauseUntil?: string },
  ctx: z.RefinementCtx
) {
  if (data.deliveryType === "CUSTOM_DAYS") {
    if (!data.deliveryDays || data.deliveryDays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one delivery day for custom schedule",
        path: ["deliveryDays"],
      });
    }
    for (const day of data.deliveryDays ?? []) {
      if (!WEEKDAYS.includes(day as typeof WEEKDAYS[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid weekday: ${day}`,
          path: ["deliveryDays"],
        });
      }
    }
  }
  if (data.deliveryType === "PAUSED") {
    if (!data.pauseFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pause start date is required",
        path: ["pauseFrom"],
      });
    }
  }
}

export const createCustomerSchema = z.object(customerFields).superRefine(requireCoordinates).superRefine(validateDeliveryPlan);

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
  deliveryType: "DAILY" | "ALTERNATE_DAYS" | "CUSTOM_DAYS" | "PAUSED";
  quantity: number;
  unit: "LITER" | "ML";
  deliveryDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[];
  pauseFrom?: string;
  pauseUntil?: string;
  deliveryStartDate?: string;
};

export const updateCustomerSchema = z.object(customerFields).partial().superRefine(requireCoordinates).superRefine(validateDeliveryPlan);

export const customerSearchSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type UpdateCustomerInput = Partial<CreateCustomerInput>;
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>;
