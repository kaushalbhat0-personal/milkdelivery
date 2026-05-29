import { eq, and, isNull } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";

export function getTenantId(session: { user: { tenantId: string } } | null): string {
  if (!session?.user?.tenantId) {
    throw new Error("No tenant context found in session");
  }
  return session.user.tenantId;
}

export function requireTenant(session: { user: { tenantId: string } } | null): string {
  const tenantId = getTenantId(session);
  return tenantId;
}

export function tenantFilter<T extends { tenantId: SQLWrapper }>(
  table: T,
  tenantId: string
): SQL {
  return eq(table.tenantId, tenantId);
}

export function activeFilter<T extends { deletedAt: SQLWrapper }>(table: T): SQL {
  return isNull(table.deletedAt);
}

export function tenantActiveFilter<T extends { tenantId: SQLWrapper; deletedAt: SQLWrapper }>(
  table: T,
  tenantId: string
): SQL {
  return and(tenantFilter(table, tenantId), activeFilter(table))!;
}
