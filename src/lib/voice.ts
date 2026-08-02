import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;
const PHONE_NUMBER_ID = process.env.ELEVENLABS_PHONE_NUMBER_ID!;

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
  if (!AGENT_ID || !PHONE_NUMBER_ID) {
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

  // Place outbound call via ElevenLabs Conversational AI telephony
  const result = await client.conversationalAi.twilio.outboundCall({
    agentId: AGENT_ID,
    agentPhoneNumberId: PHONE_NUMBER_ID,
    toNumber: opts.phone,
    conversationInitiationClientData: {
      conversationConfigOverride: {
        agent: {
          firstMessage: opts.firstMessage,
          language: opts.language === "es" ? "es" : opts.language === "ht" ? "ht" : "en",
        },
      },
      dynamicVariables: opts.dynamicVariables,
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
