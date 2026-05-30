import { requireAdmin } from "@/lib/auth-guards";
import type { Session } from "@/lib/auth-guards";
import * as queries from "./queries";

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((h) => escapeCsv(row[h])).join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export async function exportCustomers(session: Session): Promise<string> {
  const user = requireAdmin(session);
  const rows = await queries.exportCustomersQuery(user.tenantId);
  return rowsToCsv(rows as Record<string, unknown>[]);
}

export async function exportDeliveryLogs(session: Session): Promise<string> {
  const user = requireAdmin(session);
  const rows = await queries.exportDeliveryLogsQuery(user.tenantId);
  return rowsToCsv(rows as Record<string, unknown>[]);
}

export async function exportRoutes(session: Session): Promise<string> {
  const user = requireAdmin(session);
  const rows = await queries.exportRoutesQuery(user.tenantId);
  return rowsToCsv(rows as Record<string, unknown>[]);
}
