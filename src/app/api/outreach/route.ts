import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patient_id");
  const orderId = searchParams.get("order_id");
  const limit = parseInt(searchParams.get("limit") || "50");

  let rows;
  if (patientId) {
    rows = await sql`
      select om.*, p.first_name as patient_first, p.last_name as patient_last
      from outreach_messages om
      join patients p on p.id = om.patient_id
      where om.patient_id = ${patientId}::uuid
      order by om.sent_at desc
      limit ${limit}`;
  } else if (orderId) {
    rows = await sql`
      select om.*, p.first_name as patient_first, p.last_name as patient_last
      from outreach_messages om
      join patients p on p.id = om.patient_id
      where om.order_id = ${orderId}::uuid
      order by om.sent_at desc
      limit ${limit}`;
  } else {
    rows = await sql`
      select om.*, p.first_name as patient_first, p.last_name as patient_last
      from outreach_messages om
      join patients p on p.id = om.patient_id
      order by om.sent_at desc
      limit ${limit}`;
  }

  return NextResponse.json(rows);
}
