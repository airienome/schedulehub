import { createHmac, timingSafeEqual } from "crypto";
import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";

function verifySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret || !signature) return !secret; // skip verification if no secret configured
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/elevenlabs
 * Receives post-conversation webhooks from ElevenLabs Conversational AI.
 * Configured in ElevenLabs agent settings > Webhooks.
 *
 * Payload includes conversation_id, transcript, analysis, and any
 * data collected by the agent during the call.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-elevenlabs-signature"))) {
    return new Response("invalid signature", { status: 401 });
  }

  const evt = JSON.parse(raw);

  const conversationId = evt.conversation_id ?? evt.data?.conversation_id;
  if (!conversationId) {
    return new Response("missing conversation_id", { status: 400 });
  }

  // Find the outreach message that initiated this call
  const messages = await sql`
    select om.id, om.patient_id, om.order_id, om.purpose
    from outreach_messages om
    where om.provider_ref = ${conversationId}
      and om.channel = 'voice'
      and om.direction = 'outbound'
    limit 1`;

  if (!messages.length) {
    await auditLog("system", "elevenlabs_webhook_unmatched", "outreach_messages", undefined, {
      conversation_id: conversationId,
    });
    return new Response("ok", { status: 200 });
  }

  const msg = messages[0];

  // Extract transcript and analysis from the webhook payload
  const transcript = evt.transcript ?? evt.data?.transcript;
  const analysis = evt.analysis ?? evt.data?.analysis;
  const collectedData = evt.data?.collected_data ?? evt.collected_data;

  // Update the outreach message with call results
  await sql`
    update outreach_messages
    set responded = true,
        ai_extraction = ${JSON.stringify({
          transcript,
          analysis,
          collected_data: collectedData,
          conversation_id: conversationId,
        })}::jsonb
    where id = ${msg.id}::uuid`;

  // If the agent collected structured data (address, availability),
  // process it based on the call purpose
  if (collectedData) {
    await processCollectedData(
      msg.patient_id as string,
      msg.order_id as string,
      msg.purpose as string,
      collectedData
    );
  }

  await auditLog("system", "elevenlabs_webhook_processed", "outreach_messages", msg.patient_id as string, {
    conversation_id: conversationId,
    purpose: msg.purpose,
  });

  return new Response("ok", { status: 200 });
}

/**
 * Process data collected by the ElevenLabs agent during the call.
 * The agent uses tool calls or structured extraction to collect
 * address, availability, and confirmation responses.
 */
async function processCollectedData(
  patientId: string,
  orderId: string,
  purpose: string,
  data: Record<string, unknown>
) {
  switch (purpose) {
    case "intake_address": {
      const address = data.address as Record<string, string> | undefined;
      if (address?.address_line1) {
        await sql`
          update patients
          set address_line1 = ${address.address_line1},
              city = ${address.city ?? null},
              state = ${address.state ?? "FL"},
              zip = ${address.zip ?? null}
          where id = ${patientId}::uuid`;

        // Advance order status
        await sql`
          update orders set status = 'contacting_patient'
          where id = ${orderId}::uuid and status = 'received'`;
      }
      break;
    }

    case "intake_availability": {
      const windows = data.windows as Array<{
        dow: number[];
        start: string;
        end: string;
      }> | undefined;

      if (windows?.length) {
        for (const w of windows) {
          for (const dow of w.dow) {
            await sql`
              insert into patient_availability (patient_id, order_id, day_of_week, window_start, window_end)
              values (${patientId}::uuid, ${orderId}::uuid, ${dow}, ${w.start}::time, ${w.end}::time)`;
          }
        }

        await sql`
          update orders set status = 'matching'
          where id = ${orderId}::uuid and status = 'contacting_patient'`;
      }
      break;
    }

    case "offer_slot": {
      const accepted = data.accepted as boolean | undefined;
      if (accepted === true) {
        // Booking logic handled by the matching/scheduling pipeline
        await auditLog("system", "slot_accepted_via_voice", "orders", orderId, { patientId });
      } else if (accepted === false) {
        await auditLog("system", "slot_declined_via_voice", "orders", orderId, { patientId });
      }
      break;
    }

    case "confirmation": {
      const confirmed = data.confirmed as boolean | undefined;
      if (confirmed === true) {
        await auditLog("system", "appointment_confirmed_via_voice", "appointments", undefined, {
          patientId,
          orderId,
        });
      }
      break;
    }
  }
}
