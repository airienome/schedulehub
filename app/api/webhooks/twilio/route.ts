import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { callPatient } from "@/lib/voice";
import { buildFirstMessage, buildDynamicVars } from "@/lib/agent-prompt";
import { sendSms } from "@/lib/sms";

/**
 * POST /api/webhooks/twilio
 * Inbound SMS handler.
 *
 * Supported patient replies:
 *   YES / SI / OK  -> triggers ElevenLabs voice call
 *   TEXT / TEXTO   -> switches to text-based scheduling
 *   NO / STOP      -> opts out
 *   (anything else when in text mode) -> extracts availability
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
  const patientId = patient.id as string;
  const lang = patient.preferred_language as string;

  // Find active order waiting for patient response
  const orders = await sql`
    select o.id, o.status, o.provider_id, o.service_type_id, o.practice_id,
           o.frequency_per_week, o.duration_weeks
    from orders o
    where o.patient_id = ${patientId}::uuid
      and o.status in ('contacting_patient', 'matching')
    order by o.created_at desc
    limit 1`;

  if (!orders.length) {
    return twiml(
      lang === "es"
        ? "Gracias por su mensaje. No tenemos una referencia pendiente para usted."
        : "Thanks for your message! We don't have a pending referral for you right now."
    );
  }

  const order = orders[0];
  const orderId = order.id as string;

  // Log inbound message
  await sql`
    insert into outreach_messages (patient_id, order_id, channel, direction, purpose, body, provider_ref)
    values (${patientId}::uuid, ${orderId}::uuid, 'sms', 'inbound', 'intake_availability', ${body}, ${messageSid})`;

  // Mark last outbound as responded
  await sql`
    update outreach_messages
    set responded = true
    where patient_id = ${patientId}::uuid
      and order_id = ${orderId}::uuid
      and direction = 'outbound'
      and responded = false`;

  // Get provider + service info
  const { doctorName, practiceName, serviceName } = await getOrderContext(order);

  const reply = body.toLowerCase().trim();

  // --- CALL flow: patient says YES ---
  if (["yes", "y", "si", "ok", "call", "call me"].includes(reply)) {
    await auditLog("system", "patient_consent_call", "orders", orderId, { patientId });

    const firstMessage = buildFirstMessage({
      patientFirstName: patient.first_name as string,
      doctorName, practiceName, serviceName, language: lang,
    });

    await callPatient({
      patientId,
      orderId,
      phone: from,
      purpose: "intake_availability",
      firstMessage,
      language: lang,
      dynamicVariables: buildDynamicVars({
        patientId,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientPhone: from,
        orderId,
        doctorName, practiceName, serviceName,
        frequency: `${order.frequency_per_week} times per week`,
        duration: order.duration_weeks ? `${order.duration_weeks} weeks` : "as prescribed",
      }),
    });

    return twiml(
      lang === "es"
        ? "Gracias! Le llamaremos en un momento."
        : "Thanks! We'll call you in just a moment."
    );
  }

  // --- TEXT flow: patient prefers texting ---
  if (["text", "texto", "txt", "sms"].includes(reply)) {
    await auditLog("system", "patient_consent_text", "orders", orderId, { patientId });

    const askMsg = lang === "es"
      ? `Perfecto! Respondame con los dias y horarios que le funcionan. Ejemplo: "Lunes y miercoles por la manana" o "Cualquier dia despues de las 5pm"`
      : `No problem! Just reply with the days and times that work for you. Example: "Monday and Wednesday mornings" or "Any day after 5pm"`;

    await sendSms({ patientId, orderId, phone: from, body: askMsg, purpose: "intake_availability" });

    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>",
      { headers: { "Content-Type": "text/xml" } });
  }

  // --- OPT OUT ---
  if (["no", "n", "stop"].includes(reply)) {
    await auditLog("system", "patient_consent_no", "orders", orderId, { patientId });
    return twiml(
      lang === "es"
        ? "Entendido. Puede responder SI cuando este listo, o llamar al consultorio de su doctor."
        : "No problem. Reply YES or TEXT anytime when you're ready, or call your doctor's office."
    );
  }

  // --- Freeform text: patient is texting their availability ---
  // Check if the last outbound was asking for availability (text flow active)
  const lastOutbound = await sql`
    select purpose, body from outreach_messages
    where patient_id = ${patientId}::uuid and order_id = ${orderId}::uuid
      and direction = 'outbound' and channel = 'sms'
    order by sent_at desc limit 1`;

  if (lastOutbound.length && lastOutbound[0].purpose === "intake_availability") {
    // Patient is giving us their availability via text
    await sql`
      update outreach_messages
      set ai_extraction = ${JSON.stringify({ raw_availability: body, source: "sms_freeform" })}::jsonb
      where provider_ref = ${messageSid}`;

    // Store as patient availability (basic parsing - the admin can refine)
    await auditLog("system", "availability_received_text", "orders", orderId, {
      patientId, raw: body,
    });

    // Update order to matching
    await sql`update orders set status = 'matching' where id = ${orderId}::uuid and status = 'contacting_patient'`;

    const confirmMsg = lang === "es"
      ? `Gracias ${patient.first_name}! Recibimos su disponibilidad: "${body}". Buscaremos una clinica cercana y le confirmaremos por texto.`
      : `Thanks ${patient.first_name}! Got your availability: "${body}". We'll find a nearby in-network clinic and text you a confirmation.`;

    await sendSms({ patientId, orderId, phone: from, body: confirmMsg, purpose: "confirmation" });

    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>",
      { headers: { "Content-Type": "text/xml" } });
  }

  // Default: tell them their options
  return twiml(
    lang === "es"
      ? "Responda SI para recibir una llamada, TEXTO para programar por mensaje, o NO para cancelar."
      : "Reply YES to get a call, TEXT to schedule by message, or NO to opt out."
  );
}

async function getOrderContext(order: Record<string, unknown>) {
  const providers = await sql`
    select pr.first_name, pr.last_name, prac.name as practice_name
    from providers pr join practices prac on prac.id = pr.practice_id
    where pr.id = ${order.provider_id}::uuid`;

  const services = await sql`
    select name from service_types where id = ${order.service_type_id}::uuid`;

  return {
    doctorName: providers.length ? `Dr. ${providers[0].last_name}` : "your doctor",
    practiceName: providers.length ? (providers[0].practice_name as string) : "the clinic",
    serviceName: services.length ? (services[0].name as string) : "physical therapy",
  };
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
