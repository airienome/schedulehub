import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;
const RAW_PHONE_ID = process.env.ELEVENLABS_PHONE_NUMBER_ID || "";
// Accept either phnum_xxx or fall back to looking it up
const PHONE_NUMBER_ID = RAW_PHONE_ID.startsWith("phnum_") ? RAW_PHONE_ID : "";

async function getPhoneNumberId(): Promise<string> {
  if (PHONE_NUMBER_ID) return PHONE_NUMBER_ID;
  // If env var is a phone number or missing, look up via API
  try {
    const nums = await client.conversationalAi.phoneNumbers.list();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = Array.isArray(nums) ? nums : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = list.find((n: any) => n.assignedAgent?.agentId === AGENT_ID || n.assigned_agent?.agent_id === AGENT_ID);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (match) return (match as any).phoneNumberId || (match as any).phone_number_id;
  } catch { /* fall through */ }
  return RAW_PHONE_ID; // last resort: use whatever was configured
}

type CallPurpose =
  | "intake_address"
  | "intake_availability"
  | "offer_slot"
  | "confirmation"
  | "reminder_24h"
  | "reminder_2h"
  | "missed_visit_recovery"
  | "post_visit_check";

/**
 * Place an outbound voice call to a patient via ElevenLabs Conversational AI.
 * The agent (configured in ElevenLabs console) handles the conversation.
 * Dynamic variables pass context (patient name, purpose, order details)
 * so the agent can tailor its script.
 */
export async function callPatient(opts: {
  patientId: string;
  orderId: string;
  appointmentId?: string;
  phone: string;
  purpose: CallPurpose;
  firstMessage: string;
  dynamicVariables?: Record<string, string>;
  language?: string;
}) {
  const phoneNumId = await getPhoneNumberId();

  if (!AGENT_ID || !phoneNumId) {
    console.warn("ElevenLabs agent/phone not configured; logging stub call");

    await sql`
      insert into outreach_messages
        (patient_id, order_id, appointment_id, channel, direction, purpose, body, provider_ref)
      values (
        ${opts.patientId}::uuid,
        ${opts.orderId}::uuid,
        ${opts.appointmentId ?? null}::uuid,
        'voice', 'outbound', ${opts.purpose},
        ${opts.firstMessage},
        'stub_not_configured'
      )`;

    await auditLog("system", "voice_call_stub", "outreach_messages", opts.patientId, {
      purpose: opts.purpose,
    });

    return { stubbed: true };
  }

  // Normalize phone to E.164
  const digits = opts.phone.replace(/\D/g, "");
  const toNumber = digits.length === 10 ? `+1${digits}` : digits.startsWith("1") ? `+${digits}` : `+${digits}`;

  // Place outbound call via ElevenLabs Conversational AI telephony
  // Don't override first_message - use the agent's configured message with dynamic variables
  const result = await client.conversationalAi.twilio.outboundCall({
    agentId: AGENT_ID,
    agentPhoneNumberId: phoneNumId,
    toNumber,
    conversationInitiationClientData: {
      dynamicVariables: {
        patient_phone: opts.phone,
        patient_id: opts.patientId,
        patient_name: opts.dynamicVariables?.patient_name || "",
        order_id: opts.orderId,
        doctor_name: opts.dynamicVariables?.doctor_name || "",
        practice_name: opts.dynamicVariables?.practice_name || "",
        service_type: opts.dynamicVariables?.service_type || "physical therapy",
        frequency: opts.dynamicVariables?.frequency || "",
        duration: opts.dynamicVariables?.duration || "",
        language: opts.language || "en",
        ...opts.dynamicVariables,
      },
    },
  });

  const conversationId = result.conversationId;

  await sql`
    insert into outreach_messages
      (patient_id, order_id, appointment_id, channel, direction, purpose, body, provider_ref)
    values (
      ${opts.patientId}::uuid,
      ${opts.orderId}::uuid,
      ${opts.appointmentId ?? null}::uuid,
      'voice', 'outbound', ${opts.purpose},
      ${opts.firstMessage},
      ${conversationId ?? `el_${Date.now()}`}
    )`;

  await auditLog("system", "voice_call_placed", "outreach_messages", opts.patientId, {
    purpose: opts.purpose,
    conversation_id: conversationId,
  });

  return { conversationId };
}

/**
 * Fetch conversation details (transcript, analysis) after a call completes.
 * Called from the ElevenLabs post-call webhook.
 */
export async function getConversationDetails(conversationId: string) {
  return client.conversationalAi.conversations.get(conversationId);
}
