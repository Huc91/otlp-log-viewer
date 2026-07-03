import { getLogsDashboardData } from "@/features/dashboard-logs/api/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getLogsDashboardData();
  return Response.json(data);
}
