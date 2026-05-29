"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Session } from "@/lib/auth-guards";
import type { AppRole } from "@/config/roles";
import * as service from "./service";
import type { CreateCustomerInput, UpdateCustomerInput, CustomerSearchInput } from "./schemas";

async function getSession(): Promise<Session> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  const role = result.user.role as AppRole;
  return { user: { ...result.user, role } };
}

export async function getCustomersAction(input: CustomerSearchInput) {
  const session = await getSession();
  return service.getCustomers(session, input);
}

export async function getCustomerAction(id: string) {
  const session = await getSession();
  return service.getCustomer(session, id);
}

export async function createCustomerAction(input: CreateCustomerInput) {
  const session = await getSession();
  const result = await service.createCustomer(session, input);
  revalidatePath("/customers");
  return result;
}

export async function updateCustomerAction(id: string, input: UpdateCustomerInput) {
  const session = await getSession();
  const result = await service.updateCustomer(session, id, input);
  revalidatePath("/customers");
  return result;
}

export async function deleteCustomerAction(id: string) {
  const session = await getSession();
  const result = await service.deleteCustomer(session, id);
  revalidatePath("/customers");
  return result;
}
