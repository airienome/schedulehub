import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/patient-detail?id=<patient_id>
 * Full patient record for the doctor view: outreach history,
 * appointments, orders, and provider session notes.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const [outreach, orders, appointments] = await Promise.all([
    sql`
      select id, channel, direction, purpose, body, sent_at, responded, ai_extraction
      from outreach_messages
      where patient_id = ${id}::uuid
      order by sent_at desc
      limit 30`,
    sql`
      select o.id, o.status, o.frequency_per_week, o.duration_weeks,
             o.total_visits_ordered, o.urgency, o.clinical_notes,
             o.diagnosis_codes, o.created_at,
             st.name as service_name
      from orders o
      join service_types st on st.id = o.service_type_id
      where o.patient_id = ${id}::uuid
      order by o.created_at desc`,
    sql`
      select a.id, a.order_id, a.visit_number, a.status, a.status_source,
             a.scheduled_start, a.is_home_visit,
             c.name as center_name, c.phone as center_phone
      from appointments a
      join pt_centers c on c.id = a.center_id
      where a.patient_id = ${id}::uuid
      order by a.scheduled_start desc`,
  ]);

  return NextResponse.json({ outreach, orders, appointments });
}
