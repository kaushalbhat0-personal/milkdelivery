import { z } from "zod";

export const DELIVERY_TYPES = ["DAILY", "ALTERNATE_DAYS", "CUSTOM_DAYS", "PAUSED"] as const;
export const UNITS = ["LITER", "ML"] as const;
export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export const updateDeliveryPlanSchema = z.object({
  deliveryType: z.enum(DELIVERY_TYPES),
  quantity: z.coerce.number().positive("Quantity must be positive").max(999.99),
  unit: z.enum(UNITS),
  deliveryDays: z.array(z.enum(WEEKDAYS)).optional(),
  pauseFrom: z.string().optional(),
  pauseUntil: z.string().optional(),
});

export type UpdateDeliveryPlanInput = z.infer<typeof updateDeliveryPlanSchema>;
