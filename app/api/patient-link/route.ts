import { sql } from "@/lib/db";
import { buildPatientUrl } from "@/lib/patient-token";
import { auditLog } from "@/lib/audit";
import { NextResponse } from "next/server";

/**
 * POST /api/patient-link
 * Generate a short-lived signed link for a patient.
 * This is what the system sends via SMS after confirming an appointment.
 * Staff can also generate one from the admin dashboard for demo purposes.
 */
export async function POST(req: Request) {
  const { patient_id } = await req.json();

  if (!patient_id) {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  }

  // Verify patient exists
  const rows = await sql`
    select id, first_name, last_name, phone
    from patients where id = ${patient_id}::uuid`;

  if (!rows.length) {
    return NextResponse.json({ error: "patient not found" }, { status: 404 });
  }

  // Use the request origin so links work in both local dev and production
  const origin = new URL(req.url).origin;
  const url = buildPatientUrl(patient_id, origin);

  await auditLog("system", "patient_link_generated", "patients", patient_id, {
    phone: rows[0].phone,
  });

  return NextResponse.json({
    url,
    patient: `${rows[0].first_name} ${rows[0].last_name}`,
    expires_in: "30 minutes",
  });
}
