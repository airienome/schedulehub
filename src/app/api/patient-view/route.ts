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

  const [patientRows, messageRows, appointmentRows] = await Promise.all([
    sql`
      select first_name, last_name, phone
      from patients where id = ${pid}::uuid`,
    sql`
      select id, channel, direction, purpose, body, sent_at, responded, ai_extraction
      from outreach_messages
      where patient_id = ${pid}::uuid
      order by sent_at desc
      limit 50`,
    sql`
      select a.id, a.scheduled_start, a.visit_number, a.status, a.is_home_visit,
             c.name as center_name
      from appointments a
      join pt_centers c on c.id = a.center_id
      where a.patient_id = ${pid}::uuid
        and a.status in ('scheduled', 'confirmed')
        and a.scheduled_start > now()
      order by a.scheduled_start`,
  ]);

  if (!patientRows.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    patient: patientRows[0],
    messages: messageRows,
    appointments: appointmentRows,
  });
}
