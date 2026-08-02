import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { callPatient } from "@/lib/voice";
import { buildFirstMessage, buildDynamicVars } from "@/lib/agent-prompt";
import { NextResponse } from "next/server";

/**
 * POST /api/patient-request-call
 * Patient taps "Request a Call" - immediately triggers an ElevenLabs call.
 */
export async function POST(req: Request) {
  const { patient_id } = await req.json();

  if (!patient_id) {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  }

  const patients = await sql`
    select id, first_name, last_name, phone, preferred_language
    from patients where id = ${patient_id}::uuid`;

  if (!patients.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const patient = patients[0];
  const lang = patient.preferred_language as string;

  // Find active order with provider/service info
  const orders = await sql`
    select o.id, o.provider_id, o.service_type_id, o.frequency_per_week, o.duration_weeks,
           pr.first_name as doc_first, pr.last_name as doc_last,
           prac.name as practice_name,
           st.name as service_name
    from orders o
    join providers pr on pr.id = o.provider_id
    join practices prac on prac.id = o.practice_id
    join service_types st on st.id = o.service_type_id
    where o.patient_id = ${patient_id}::uuid
      and o.status in ('contacting_patient', 'matching', 'scheduled', 'in_progress')
    order by o.created_at desc limit 1`;

  if (!orders.length) {
    return NextResponse.json({ error: "no active order" }, { status: 404 });
  }

  const order = orders[0];
  const orderId = order.id as string;
  const doctorName = `Dr. ${order.doc_last}`;
  const practiceName = order.practice_name as string;
  const serviceName = order.service_name as string;

  await auditLog("patient", "call_requested_immediate", "patients", patient_id);

  // Normalize phone to E.164
  const rawPhone = (patient.phone as string).replace(/\D/g, "");
  const e164Phone = rawPhone.length === 10 ? `+1${rawPhone}` : rawPhone.startsWith("1") ? `+${rawPhone}` : `+${rawPhone}`;

  const firstMessage = buildFirstMessage({
    patientFirstName: patient.first_name as string,
    doctorName, practiceName, serviceName, language: lang,
  });

  try {
    await callPatient({
      patientId: patient_id,
      orderId,
      phone: e164Phone,
      purpose: "intake_availability",
      firstMessage,
      language: lang,
      dynamicVariables: buildDynamicVars({
        patientId: patient_id,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientPhone: e164Phone,
        orderId,
        doctorName, practiceName, serviceName,
        frequency: `${order.frequency_per_week} times per week`,
        duration: order.duration_weeks ? `${order.duration_weeks} weeks` : "as prescribed",
      }),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ElevenLabs call failed:", msg);
    return NextResponse.json({ error: `Call failed: ${msg}` }, { status: 500 });
  }

  // Update order status
  await sql`
    update orders set status = 'contacting_patient'
    where id = ${orderId}::uuid and status in ('matching', 'scheduled')`;

  return NextResponse.json({ ok: true });
}
