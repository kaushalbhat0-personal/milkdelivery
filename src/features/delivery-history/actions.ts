"use server";

import { getSession } from "@/lib/session";
import * as service from "./service";

export async function getCustomerDeliveryHistoryAction(customerId: string) {
  const session = await getSession();
  return service.getCustomerDeliveryHistory(session, customerId);
}
