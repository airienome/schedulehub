import { getAdherenceDashboard } from "@/lib/queries/adherence";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const practiceId = searchParams.get("practice_id") ?? undefined;
  const rows = await getAdherenceDashboard(practiceId);
  return NextResponse.json(rows);
}
