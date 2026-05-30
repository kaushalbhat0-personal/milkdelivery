import { getTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import * as queries from "./queries";
import type { NewCustomerRow } from "./queries";
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

  const updateData: Record<string, unknown> = {
    name: data.name,
    phone: data.phone,
    address: data.address,
    placeId: data.placeId,
    formattedAddress: data.formattedAddress,
    landmark: data.landmark,
    notes: data.notes,
    latitude: data.latitude?.toString(),
    longitude: data.longitude?.toString(),
    isActive: data.isActive,
    deliveryType: data.deliveryType,
    quantity: data.quantity.toString(),
    unit: data.unit,
    deliveryStartDate: data.deliveryType === "ALTERNATE_DAYS" ? (data.deliveryStartDate ?? null) : null,
    tenantId,
  };

  if (data.deliveryType === "CUSTOM_DAYS") {
    updateData.deliveryDays = data.deliveryDays ?? [];
  }

  if (data.deliveryType === "PAUSED") {
    updateData.pauseFrom = data.pauseFrom ?? null;
    updateData.pauseUntil = data.pauseUntil ?? null;
  }

  return queries.createCustomerQuery(updateData as NewCustomerRow);
}

export async function updateCustomer(session: Session, id: string, input: UpdateCustomerInput) {
  const user = requireAdmin(session);
  const tenantId = user.tenantId;

  const existing = await queries.getCustomerByIdQuery(id, tenantId);
  if (!existing) {
    throw new Error("Customer not found");
  }

  const data = updateCustomerSchema.parse(input);

  const updateData: Record<string, unknown> = { updatedBy: user.id };
  const fields: (keyof typeof data)[] = [
    "name", "phone", "address", "placeId", "formattedAddress",
    "landmark", "notes", "isActive",
  ];
  for (const field of fields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }
  if (data.latitude !== undefined) updateData.latitude = data.latitude.toString();
  if (data.longitude !== undefined) updateData.longitude = data.longitude.toString();
  if (data.deliveryType !== undefined) {
    updateData.deliveryType = data.deliveryType;
    if (data.deliveryType === "CUSTOM_DAYS") {
      updateData.deliveryDays = data.deliveryDays ?? [];
    } else {
      updateData.deliveryDays = null;
    }
    if (data.deliveryType === "PAUSED") {
      updateData.pauseFrom = data.pauseFrom ?? null;
      updateData.pauseUntil = data.pauseUntil ?? null;
    } else {
      updateData.pauseFrom = null;
      updateData.pauseUntil = null;
    }
  }
  if (data.quantity !== undefined) updateData.quantity = data.quantity.toString();
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.deliveryStartDate !== undefined) {
    updateData.deliveryStartDate = data.deliveryStartDate || null;
  } else if (data.deliveryType === "ALTERNATE_DAYS" && !data.deliveryStartDate) {
    updateData.deliveryStartDate = existing.createdAt.toISOString().split("T")[0];
  }

  const updated = await queries.updateCustomerQuery(id, tenantId, updateData);
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
