"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Session } from "@/lib/auth-guards";
import type { AppRole } from "@/config/roles";
import * as service from "./service";
import type { CreateDriverInput, UpdateDriverInput, DriverSearchInput } from "./schemas";

async function getSession(): Promise<Session> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  return { user: { ...result.user, role: result.user.role as AppRole } };
}

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
  revalidatePath("/drivers");
  return result;
}

export async function updateDriverAction(id: string, input: UpdateDriverInput) {
  const session = await getSession();
  const result = await service.updateDriver(session, id, input);
  revalidatePath("/drivers");
  return result;
}

export async function deleteDriverAction(id: string) {
  const session = await getSession();
  const result = await service.deleteDriver(session, id);
  revalidatePath("/drivers");
  return result;
}
