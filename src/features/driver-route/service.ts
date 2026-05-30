import { requireDriver } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import * as queries from "./queries";

export async function getAssignedRoute(session: Session) {
  const user = requireDriver(session);
  return queries.getAssignedRouteQuery(user.id, user.tenantId);
}
