"use server";

import { getSession } from "@/lib/session";
import * as service from "./service";

export async function getTodayDashboardAction() {
  const session = await getSession();
  return service.getTodayDashboard(session);
}
