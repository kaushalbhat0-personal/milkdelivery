import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema/customers";
import { tenantActiveFilter } from "@/lib/tenant";

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;

export async function getCustomersQuery(
  tenantId: string,
  options: { search?: string; page: number; pageSize: number }
) {
  const { search, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  const conditions = [tenantActiveFilter(customers, tenantId)];

  if (search) {
    conditions.push(
      or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.phone, `%${search}%`),
        ilike(customers.address, `%${search}%`)
      )!
    );
  }

  const where = and(...conditions);

  const [total] = await db
    .select({ total: count() })
    .from(customers)
    .where(where);

  const rows = await db
    .select()
    .from(customers)
    .where(where)
    .orderBy(asc(customers.name))
    .limit(pageSize)
    .offset(offset);

  return { rows, total: total.total };
}

export async function getCustomerByIdQuery(id: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, id),
        tenantActiveFilter(customers, tenantId)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function createCustomerQuery(
  data: NewCustomerRow
): Promise<CustomerRow> {
  const [row] = await db.insert(customers).values(data).returning();
  return row;
}

export async function updateCustomerQuery(
  id: string,
  tenantId: string,
  data: Partial<NewCustomerRow>
): Promise<CustomerRow | null> {
  const [row] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(customers.id, id), tenantActiveFilter(customers, tenantId))
    )
    .returning();

  return row ?? null;
}

export async function softDeleteCustomerQuery(
  id: string,
  tenantId: string
): Promise<CustomerRow | null> {
  const [row] = await db
    .update(customers)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(customers.id, id), tenantActiveFilter(customers, tenantId))
    )
    .returning();

  return row ?? null;
}
