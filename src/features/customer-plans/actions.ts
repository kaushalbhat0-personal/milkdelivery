"use server";

import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/session";
import * as service from "./service";
import type { UpdateDeliveryPlanInput } from "./schemas";
import { CUSTOMER_TAG } from "@/lib/cache-tags";

export async function updateDeliveryPlanAction(customerId: string, input: UpdateDeliveryPlanInput) {
  const session = await getSession();
  const result = await service.updateDeliveryPlan(session, customerId, input);
  revalidateTag(CUSTOMER_TAG, "max");
  return result;
}
