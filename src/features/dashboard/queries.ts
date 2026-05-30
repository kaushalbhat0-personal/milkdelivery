import { and, count, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema/customers";
import { users } from "@/lib/db/schema/auth";
import { routes } from "@/lib/db/schema/routes";
import { ROLES } from "@/config/roles";

const customerCountStmt = db
  .select({ total: count() })
  .from(customers)
  .where(and(eq(customers.tenantId, sql.placeholder("tenantId")), isNull(customers.deletedAt)))
  .prepare("dash_customer_count");

const driverCountStmt = db
  .select({ total: count() })
  .from(users)
  .where(and(eq(users.tenantId, sql.placeholder("tenantId")), eq(users.role, sql.placeholder("role")), isNull(users.deletedAt)))
  .prepare("dash_driver_count");

const routeCountStmt = db
  .select({ total: count() })
  .from(routes)
  .where(and(eq(routes.tenantId, sql.placeholder("tenantId")), isNull(routes.deletedAt)))
  .prepare("dash_route_count");

export async function getCountsQuery(tenantId: string) {
  const [[customerCount], [driverCount], [routeCount]] = await Promise.all([
    customerCountStmt.execute({ tenantId }),
    driverCountStmt.execute({ tenantId, role: ROLES.DRIVER }),
    routeCountStmt.execute({ tenantId }),
  ]);

  return {
    customerCount: customerCount.total,
    driverCount: driverCount.total,
    routeCount: routeCount.total,
  };
}
