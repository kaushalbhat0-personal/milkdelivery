import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { tenantFilter } from "@/lib/tenant";
import { ROLES } from "@/config/roles";

export type DriverRow = typeof users.$inferSelect;

function driverScope(tenantId: string) {
  return and(
    tenantFilter(users, tenantId),
    eq(users.role, ROLES.DRIVER),
    isNull(users.deletedAt)
  )!;
}

export async function getDriversQuery(
  tenantId: string,
  options: { search?: string; page: number; pageSize: number }
) {
  const { search, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  const conditions = [driverScope(tenantId)];

  if (search) {
    conditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.phone, `%${search}%`)
      )!
    );
  }

  const where = and(...conditions);

  const [total] = await db
    .select({ total: count() })
    .from(users)
    .where(where);

  const rows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(asc(users.name))
    .limit(pageSize)
    .offset(offset);

  return { rows, total: total.total };
}

export async function getDriverByIdQuery(id: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, id),
        driverScope(tenantId)
      )
    )
    .limit(1);

  return row ?? null;
}
