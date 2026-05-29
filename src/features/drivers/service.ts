import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { auth } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import { ROLES } from "@/config/roles";
import * as queries from "./queries";
import {
  createDriverSchema,
  updateDriverSchema,
  driverSearchSchema,
  type CreateDriverInput,
  type UpdateDriverInput,
  type DriverSearchInput,
} from "./schemas";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function getDrivers(session: Session, input: DriverSearchInput) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const params = driverSearchSchema.parse(input);

  return queries.getDriversQuery(tenantId, params);
}

export async function getDriver(session: Session, id: string) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const driver = await queries.getDriverByIdQuery(id, tenantId);
  if (!driver) {
    throw new Error("Driver not found");
  }
  return driver;
}

export async function createDriver(session: Session, input: CreateDriverInput, headers: Headers) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const data = createDriverSchema.parse(input);

  const tempPassword = generatePassword();

  const result = await auth.api.createUser({
    body: {
      email: data.email.toLowerCase(),
      name: data.name,
      password: tempPassword,
      role: ROLES.DRIVER,
      data: {
        tenantId,
        phone: data.phone ?? null,
      },
    },
    headers,
  });

  return { driverId: result.user.id, tempPassword, email: data.email.toLowerCase() };
}

export async function updateDriver(session: Session, id: string, input: UpdateDriverInput) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const existing = await queries.getDriverByIdQuery(id, tenantId);
  if (!existing) {
    throw new Error("Driver not found");
  }

  const data = updateDriverSchema.parse(input);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email.toLowerCase();
  if (data.phone !== undefined) updateData.phone = data.phone ?? null;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(
      and(eq(users.id, id), eq(users.tenantId, tenantId))
    )
    .returning();

  if (!updated) {
    throw new Error("Failed to update driver");
  }
  return updated;
}

export async function deleteDriver(session: Session, id: string) {
  requireAdmin(session);
  const tenantId = getTenantId(session);

  const existing = await queries.getDriverByIdQuery(id, tenantId);
  if (!existing) {
    throw new Error("Driver not found");
  }

  const [deleted] = await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(users.id, id), eq(users.tenantId, tenantId))
    )
    .returning();

  if (!deleted) {
    throw new Error("Failed to delete driver");
  }
  return deleted;
}
