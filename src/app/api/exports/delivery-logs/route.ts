import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exportDeliveryLogs } from "@/features/exports/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const csv = await exportDeliveryLogs(session);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="delivery-logs-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
