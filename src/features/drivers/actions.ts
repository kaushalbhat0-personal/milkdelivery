"use server";

import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/session";
import * as service from "./service";
import type { CreateDriverInput, UpdateDriverInput, DriverSearchInput } from "./schemas";
import { DRIVER_TAG } from "@/lib/cache-tags";

export async function getDriversAction(input: DriverSearchInput) {
  const session = await getSession();
  return service.getDrivers(session, input);
}

export async function getDriverAction(id: string) {
  const session = await getSession();
  return service.getDriver(session, id);
}

export async function createDriverAction(input: CreateDriverInput) {
  const session = await getSession();
  const hdrs = await headers();
  const result = await service.createDriver(session, input, hdrs);
  revalidateTag(DRIVER_TAG, "max");
  return result;
}

export async function updateDriverAction(id: string, input: UpdateDriverInput) {
  const session = await getSession();
  const result = await service.updateDriver(session, id, input);
  revalidateTag(DRIVER_TAG, "max");
  return result;
}

export async function deleteDriverAction(id: string) {
  const session = await getSession();
  const result = await service.deleteDriver(session, id);
  revalidateTag(DRIVER_TAG, "max");
  return result;
}
