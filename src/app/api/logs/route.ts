import { type NextRequest } from "next/server";
import { getLogsDashboardData } from "@/features/dashboard-logs/api/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const severity = request.nextUrl.searchParams.get("severity") ?? "";
  const data = await getLogsDashboardData(severity);
  return Response.json(data);
}
