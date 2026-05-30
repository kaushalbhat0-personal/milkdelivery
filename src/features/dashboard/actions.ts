"use server";

import { getSession } from "@/lib/session";
import * as service from "./service";

export async function getDashboardCountsAction() {
  const session = await getSession();
  return service.getDashboardCounts(session);
}
