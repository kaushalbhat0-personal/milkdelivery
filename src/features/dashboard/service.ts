import { requireAdmin } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import * as queries from "./queries";

export async function getDashboardCounts(session: Session) {
  const user = requireAdmin(session);
  return queries.getCountsQuery(user.tenantId);
}
