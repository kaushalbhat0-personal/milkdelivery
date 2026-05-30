"use server";

import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/session";
import * as service from "./service";
import type { CreateCustomerInput, UpdateCustomerInput, CustomerSearchInput } from "./schemas";
import { CUSTOMER_TAG } from "@/lib/cache-tags";

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
  revalidateTag(CUSTOMER_TAG, "max");
  return result;
}

export async function updateCustomerAction(id: string, input: UpdateCustomerInput) {
  const session = await getSession();
  const result = await service.updateCustomer(session, id, input);
  revalidateTag(CUSTOMER_TAG, "max");
  return result;
}

export async function deleteCustomerAction(id: string) {
  const session = await getSession();
  const result = await service.deleteCustomer(session, id);
  revalidateTag(CUSTOMER_TAG, "max");
  return result;
}
