import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/patient-view?pid=<patient_id>
 * Returns patient info, messages, and appointments for the token-verified patient.
 * This is called by the patient timeline component after server-side token verification.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pid = searchParams.get("pid");

  if (!pid) {
    return NextResponse.json({ error: "missing pid" }, { status: 400 });
  }

  try {

  const [patientRows, orderRows, appointmentRows, messageRows] = await Promise.all([
    sql`
      select p.first_name, p.last_name, p.phone, p.address_line1, p.city, p.state, p.zip
      from patients p where p.id = ${pid}::uuid`,
    sql`
      select o.id, o.status, o.frequency_per_week, o.duration_weeks, o.total_visits_ordered,
             o.urgency, o.clinical_notes, o.diagnosis_codes, o.created_at,
             st.name as service_name, st.code as service_code,
             pr.first_name as doctor_first, pr.last_name as doctor_last,
             prac.name as practice_name, prac.phone as practice_phone
      from orders o
      join service_types st on st.id = o.service_type_id
      join providers pr on pr.id = o.provider_id
      join practices prac on prac.id = o.practice_id
      where o.patient_id = ${pid}::uuid
      order by o.created_at desc`,
    sql`
      select a.id, a.order_id, a.scheduled_start, a.visit_number, a.status,
             a.is_home_visit, a.status_source,
             c.name as center_name, c.address_line1 as center_address,
             c.city as center_city, c.state as center_state, c.zip as center_zip,
             c.phone as center_phone
      from appointments a
      join pt_centers c on c.id = a.center_id
      where a.patient_id = ${pid}::uuid
      order by a.scheduled_start`,
    sql`
      select id, channel, direction, purpose, body, sent_at, responded
      from outreach_messages
      where patient_id = ${pid}::uuid
      order by sent_at desc
      limit 20`,
  ]);

  if (!patientRows.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    patient: patientRows[0],
    orders: orderRows,
    appointments: appointmentRows,
    messages: messageRows,
  });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("patient-view error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
