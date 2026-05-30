import { requireAdmin } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import * as queries from "./queries";

export async function getCustomerDeliveryHistory(
  session: Session,
  customerId: string
) {
  const user = requireAdmin(session);
  const tenantId = user.tenantId;

  return queries.getCustomerDeliveryHistoryQuery(customerId, tenantId, { limit: 30 });
}
