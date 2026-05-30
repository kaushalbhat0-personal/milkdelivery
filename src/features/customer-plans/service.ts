import { requireAdmin } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import * as queries from "./queries";
import {
  updateDeliveryPlanSchema,
  type UpdateDeliveryPlanInput,
} from "./schemas";
import * as customerQueries from "@/features/customers/queries";

export async function updateDeliveryPlan(
  session: Session,
  customerId: string,
  input: UpdateDeliveryPlanInput
) {
  const user = requireAdmin(session);
  const tenantId = user.tenantId;

  const existing = await customerQueries.getCustomerByIdQuery(customerId, tenantId);
  if (!existing) {
    throw new Error("Customer not found");
  }

  const data = updateDeliveryPlanSchema.parse(input);

  const updateData: Record<string, unknown> = {
    deliveryType: data.deliveryType,
    quantity: data.quantity.toString(),
    unit: data.unit,
    updatedBy: user.id,
  };

  if (data.deliveryType === "CUSTOM_DAYS") {
    updateData.deliveryDays = data.deliveryDays ?? [];
  } else {
    updateData.deliveryDays = null;
  }

  if (data.deliveryType === "PAUSED") {
    updateData.pauseFrom = data.pauseFrom ?? null;
    updateData.pauseUntil = data.pauseUntil ?? null;
  } else {
    updateData.pauseFrom = null;
    updateData.pauseUntil = null;
  }

  const updated = await queries.updateCustomerPlanQuery(customerId, tenantId, updateData);
  if (!updated) {
    throw new Error("Failed to update delivery plan");
  }

  return updated;
}
