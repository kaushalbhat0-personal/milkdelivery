import { getTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import * as queries from "./queries";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerSearchSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type CustomerSearchInput,
} from "./schemas";

export async function getCustomers(session: Session, input: CustomerSearchInput) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const params = customerSearchSchema.parse(input);

  return queries.getCustomersQuery(tenantId, params);
}

export async function getCustomer(session: Session, id: string) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const customer = await queries.getCustomerByIdQuery(id, tenantId);
  if (!customer) {
    throw new Error("Customer not found");
  }
  return customer;
}

export async function createCustomer(session: Session, input: CreateCustomerInput) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const data = createCustomerSchema.parse(input);

  return queries.createCustomerQuery({
    ...data,
    latitude: data.latitude?.toString(),
    longitude: data.longitude?.toString(),
    tenantId,
  });
}

export async function updateCustomer(session: Session, id: string, input: UpdateCustomerInput) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const existing = await queries.getCustomerByIdQuery(id, tenantId);
  if (!existing) {
    throw new Error("Customer not found");
  }

  const data = updateCustomerSchema.parse(input);

  const updated = await queries.updateCustomerQuery(id, tenantId, {
    ...data,
    latitude: data.latitude?.toString(),
    longitude: data.longitude?.toString(),
  });
  if (!updated) {
    throw new Error("Failed to update customer");
  }
  return updated;
}

export async function deleteCustomer(session: Session, id: string) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const existing = await queries.getCustomerByIdQuery(id, tenantId);
  if (!existing) {
    throw new Error("Customer not found");
  }

  const deleted = await queries.softDeleteCustomerQuery(id, tenantId);
  if (!deleted) {
    throw new Error("Failed to delete customer");
  }
  return deleted;
}
