import { createHmac, timingSafeEqual } from "crypto";
import { sql } from "@/lib/db";

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", process.env.NEON_AUTH_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function audit(
  appUserId: string | null,
  identifier: string,
  method: string,
  event: string,
  providerRef?: string
) {
  await sql`
    insert into login_events (app_user_id, identifier, method, event, provider_ref)
    values (${appUserId}::uuid, ${identifier}, ${method}, ${event}, ${providerRef ?? null})`;
}

/**
 * POST /api/webhooks/neon-auth
 * Receives auth events from Neon Auth (Better Auth).
 *
 * Staff auth is email magic link only (no SMS OTP).
 * Neon Auth handles email delivery natively.
 * This webhook logs auth events for audit and handles
 * invite-to-user linking on first sign-in.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-webhook-signature"))) {
    return new Response("invalid signature", { status: 401 });
  }

  const evt = JSON.parse(raw);

  switch (evt.type) {
    // Magic link was sent (Neon Auth delivers via email)
    case "magic_link_delivery": {
      const { email } = evt;
      await audit(null, email, "email_magic_link", "sent");
      break;
    }

    // User verified (signed in via magic link)
    case "user.verified":
    case "session.created": {
      const email = evt.user?.email ?? evt.email;
      if (email) {
        await audit(null, email, "email_magic_link", "verified");

        // Auto-link: if a pending invite exists for this email,
        // create the app_users row on first sign-in.
        await linkInviteIfNeeded(email, evt.user?.id);
      }
      break;
    }
  }

  return new Response("ok", { status: 200 });
}

/**
 * When a user signs in for the first time, check if there's
 * a pending invite matching their email and create the app_users row.
 */
async function linkInviteIfNeeded(email: string, authUserId?: string) {
  if (!authUserId) return;

  // Check if app_users row already exists
  const existing = await sql`
    select id from app_users where auth_user_id = ${authUserId} limit 1`;
  if (existing.length) return;

  // Find pending invite
  const invites = await sql`
    select id, role, practice_id, center_id, provider_id
    from user_invites
    where lower(email) = lower(${email})
      and status = 'pending'
      and expires_at > now()
    limit 1`;

  if (!invites.length) return;

  const invite = invites[0];

  await sql`
    insert into app_users (auth_user_id, role, practice_id, center_id, provider_id)
    values (${authUserId}, ${invite.role}, ${invite.practice_id}::uuid,
            ${invite.center_id}::uuid, ${invite.provider_id}::uuid)`;

  await sql`
    update user_invites
    set status = 'accepted', accepted_at = now()
    where id = ${invite.id}::uuid`;
}
