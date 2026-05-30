import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema/customers";
import { tenantActiveFilter } from "@/lib/tenant";

export async function updateCustomerPlanQuery(
  id: string,
  tenantId: string,
  data: Record<string, unknown>
) {
  const [row] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(customers.id, id), tenantActiveFilter(customers, tenantId)))
    .returning();

  return row ?? null;
}
