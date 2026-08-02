import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { sendSms } from "@/lib/sms";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const practiceId = searchParams.get("practice_id");
  const status = searchParams.get("status");

  let rows;
  if (practiceId && status) {
    rows = await sql`
      select o.*, p.first_name as patient_first, p.last_name as patient_last,
             p.phone as patient_phone, st.code as service_code, st.name as service_name,
             pr.first_name as provider_first, pr.last_name as provider_last
      from orders o
      join patients p on p.id = o.patient_id
      join service_types st on st.id = o.service_type_id
      join providers pr on pr.id = o.provider_id
      where o.practice_id = ${practiceId}::uuid and o.status = ${status}
      order by o.created_at desc`;
  } else if (practiceId) {
    rows = await sql`
      select o.*, p.first_name as patient_first, p.last_name as patient_last,
             p.phone as patient_phone, st.code as service_code, st.name as service_name,
             pr.first_name as provider_first, pr.last_name as provider_last
      from orders o
      join patients p on p.id = o.patient_id
      join service_types st on st.id = o.service_type_id
      join providers pr on pr.id = o.provider_id
      where o.practice_id = ${practiceId}::uuid
      order by o.created_at desc`;
  } else {
    rows = await sql`
      select o.*, p.first_name as patient_first, p.last_name as patient_last,
             p.phone as patient_phone, st.code as service_code, st.name as service_name,
             pr.first_name as provider_first, pr.last_name as provider_last,
             prac.name as practice_name
      from orders o
      join patients p on p.id = o.patient_id
      join service_types st on st.id = o.service_type_id
      join providers pr on pr.id = o.provider_id
      join practices prac on prac.id = o.practice_id
      order by o.created_at desc`;
  }

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();

  const {
    provider_id,
    practice_id,
    patient_id,
    service_type_id,
    diagnosis_codes,
    frequency_per_week,
    duration_weeks,
    total_visits_ordered,
    reeval_interval_days,
    home_visits_allowed,
    urgency,
    clinical_notes,
  } = body;

  // Create the order
  const rows = await sql`
    insert into orders (
      provider_id, practice_id, patient_id, service_type_id,
      diagnosis_codes, frequency_per_week, duration_weeks,
      total_visits_ordered, reeval_interval_days,
      home_visits_allowed, urgency, clinical_notes,
      status, received_via, expires_at
    ) values (
      ${provider_id}::uuid, ${practice_id}::uuid, ${patient_id}::uuid,
      ${service_type_id}::uuid,
      ${diagnosis_codes ? `{${diagnosis_codes.join(",")}}` : null}::text[],
      ${frequency_per_week}, ${duration_weeks},
      ${total_visits_ordered || frequency_per_week * (duration_weeks || 0)},
      ${reeval_interval_days || 14},
      ${home_visits_allowed || false}, ${urgency || "routine"},
      ${clinical_notes || null},
      'received', 'web_form', now() + interval '90 days'
    ) returning *`;

  const order = rows[0];

  await auditLog("demo_doctor", "order_created", "orders", order.id as string, {
    patient_id,
    provider_id,
  });

  // Get patient info for the SMS
  const patients = await sql`
    select first_name, last_name, phone, preferred_language
    from patients where id = ${patient_id}::uuid`;

  if (patients.length) {
    const patient = patients[0];
    const lang = patient.preferred_language as string;

    // Get provider info for the message
    const providers = await sql`
      select pr.first_name, pr.last_name, prac.name as practice_name
      from providers pr join practices prac on prac.id = pr.practice_id
      where pr.id = ${provider_id}::uuid`;

    const services = await sql`
      select name from service_types where id = ${service_type_id}::uuid`;

    const providerName = providers.length
      ? `Dr. ${providers[0].last_name}`
      : "your doctor";
    const practiceName = providers.length
      ? (providers[0].practice_name as string)
      : "the clinic";
    const serviceName = services.length
      ? (services[0].name as string)
      : "physical therapy";

    // Step 1: Text the patient asking for consent to call
    const smsBody =
      lang === "es"
        ? `Hola ${patient.first_name}, le escribimos de parte de ${providerName} en ${practiceName}. El doctor le ha referido para ${serviceName}. Podemos llamarle para coordinar sus citas? Responda SI para recibir la llamada.`
        : `Hi ${patient.first_name}, this is ScheduleHub on behalf of ${providerName} at ${practiceName}. The doctor has referred you for ${serviceName}. Can we call you to schedule your appointments? Reply YES to receive a call.`;

    // Update order status
    await sql`
      update orders set status = 'contacting_patient' where id = ${order.id}::uuid`;

    // Send the SMS via Twilio
    await sendSms({
      patientId: patient_id,
      orderId: order.id as string,
      phone: patient.phone as string,
      body: smsBody,
      purpose: "intake_availability",
    });
  }

  return NextResponse.json(order, { status: 201 });
}
