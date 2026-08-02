import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { sendSms } from "@/lib/sms";
import { NextResponse } from "next/server";

/**
 * POST /api/patient-request-call
 * Patient requests a scheduling call from their patient page.
 * Sends them a confirmation text and logs the request.
 */
export async function POST(req: Request) {
  const { patient_id } = await req.json();

  if (!patient_id) {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  }

  const patients = await sql`
    select id, first_name, phone, preferred_language
    from patients where id = ${patient_id}::uuid`;

  if (!patients.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const patient = patients[0];

  // Find active order
  const orders = await sql`
    select id from orders
    where patient_id = ${patient_id}::uuid
      and status in ('contacting_patient', 'matching', 'scheduled', 'in_progress')
    order by created_at desc limit 1`;

  const orderId = orders.length ? (orders[0].id as string) : null;

  await auditLog("patient", "call_requested", "patients", patient_id);

  // Text them a confirmation
  if (orderId) {
    const lang = patient.preferred_language as string;
    await sendSms({
      patientId: patient_id,
      orderId,
      phone: patient.phone as string,
      body: lang === "es"
        ? `${patient.first_name}, recibimos su solicitud. Le llamaremos pronto para coordinar sus citas de terapia.`
        : `${patient.first_name}, we got your request! We'll call you shortly to schedule your therapy appointments.`,
      purpose: "confirmation",
    });

    // Update order status
    await sql`
      update orders set status = 'contacting_patient'
      where id = ${orderId}::uuid and status in ('matching', 'scheduled')`;
  }

  return NextResponse.json({ ok: true });
}
