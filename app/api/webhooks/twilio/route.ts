import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { callPatient } from "@/lib/voice";

/**
 * POST /api/webhooks/twilio
 * Inbound SMS handler. When a patient replies YES to the consent text,
 * triggers the ElevenLabs voice call.
 */
export async function POST(req: Request) {
  const formData = await req.formData();
  const from = formData.get("From") as string;
  const body = (formData.get("Body") as string || "").trim();
  const messageSid = formData.get("MessageSid") as string;

  if (!from || !body) {
    return new Response("missing fields", { status: 400 });
  }

  // Normalize phone for matching
  const digits = from.replace(/\D/g, "");
  const last10 = digits.slice(-10);

  // Find patient by phone
  const patients = await sql`
    select id, first_name, last_name, phone, preferred_language
    from patients
    where replace(replace(replace(phone, '-', ''), '(', ''), ')', '') like ${"%" + last10}
    limit 1`;

  if (!patients.length) {
    return twiml("We could not find your information. Please call your doctor's office for assistance.");
  }

  const patient = patients[0];

  // Find active order waiting for patient response
  const orders = await sql`
    select o.id, o.status, o.provider_id, o.service_type_id, o.practice_id,
           o.frequency_per_week, o.duration_weeks
    from orders o
    where o.patient_id = ${patient.id}::uuid
      and o.status = 'contacting_patient'
    order by o.created_at desc
    limit 1`;

  if (!orders.length) {
    return twiml("Thanks for your message! We don't have a pending referral for you right now.");
  }

  const order = orders[0];

  // Log inbound message
  await sql`
    insert into outreach_messages (patient_id, order_id, channel, direction, purpose, body, provider_ref)
    values (${patient.id}::uuid, ${order.id}::uuid, 'sms', 'inbound', 'intake_availability', ${body}, ${messageSid})`;

  // Mark last outbound as responded
  await sql`
    update outreach_messages
    set responded = true
    where patient_id = ${patient.id}::uuid
      and order_id = ${order.id}::uuid
      and direction = 'outbound'
      and responded = false`;

  const reply = body.toLowerCase();

  if (reply === "yes" || reply === "y" || reply === "si" || reply === "ok") {
    await auditLog("system", "patient_consent_yes", "orders", order.id as string, {
      patient_id: patient.id,
    });

    // Get provider + service info for the call
    const providers = await sql`
      select pr.first_name, pr.last_name, prac.name as practice_name
      from providers pr join practices prac on prac.id = pr.practice_id
      where pr.id = ${order.provider_id}::uuid`;

    const services = await sql`
      select name from service_types where id = ${order.service_type_id}::uuid`;

    const providerName = providers.length ? `Dr. ${providers[0].last_name}` : "your doctor";
    const practiceName = providers.length ? (providers[0].practice_name as string) : "the clinic";
    const serviceName = services.length ? (services[0].name as string) : "physical therapy";
    const lang = patient.preferred_language as string;

    const firstMessage =
      lang === "es"
        ? `Hola ${patient.first_name}, le llamo del consultorio de ${providerName} en ${practiceName}. El doctor le ha referido para ${serviceName}. Necesito saber que dias y horarios le funcionan mejor para sus citas. Que dias de la semana puede ir y a que horas?`
        : `Hi ${patient.first_name}, I'm calling from ${providerName}'s office at ${practiceName}. The doctor has referred you for ${serviceName}. I need to find out what days and times work best for your therapy appointments. What days of the week work for you and what times are you available?`;

    // Place the ElevenLabs call
    await callPatient({
      patientId: patient.id as string,
      orderId: order.id as string,
      phone: from,
      purpose: "intake_availability",
      firstMessage,
      language: lang,
      dynamicVariables: {
        patient_name: `${patient.first_name} ${patient.last_name}`,
        doctor_name: providerName,
        practice_name: practiceName,
        service_type: serviceName,
        frequency: `${order.frequency_per_week} times per week`,
        duration: order.duration_weeks ? `${order.duration_weeks} weeks` : "as prescribed",
      },
    });

    return twiml(
      lang === "es"
        ? "Gracias! Le llamaremos en un momento para coordinar sus citas."
        : "Thanks! We'll call you in just a moment to schedule your appointments."
    );
  } else if (reply === "no" || reply === "n" || reply === "stop") {
    await auditLog("system", "patient_consent_no", "orders", order.id as string, {
      patient_id: patient.id,
    });

    return twiml("No problem. You can reply YES anytime when you're ready, or call your doctor's office.");
  } else {
    return twiml("Reply YES to schedule a quick call about your PT referral, or NO to opt out.");
  }
}

function twiml(message: string) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
