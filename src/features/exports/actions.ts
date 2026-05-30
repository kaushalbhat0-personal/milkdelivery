"use server";

import { getSession } from "@/lib/session";
import * as service from "./service";

export async function exportCustomersAction() {
  const session = await getSession();
  return service.exportCustomers(session);
}

export async function exportDeliveryLogsAction() {
  const session = await getSession();
  return service.exportDeliveryLogs(session);
}

export async function exportRoutesAction() {
  const session = await getSession();
  return service.exportRoutes(session);
}
