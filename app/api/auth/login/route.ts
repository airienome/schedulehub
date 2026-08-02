import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/login
 * Passwordless magic link login for staff.
 *
 * In production, this sends a magic link email via Neon Auth.
 * For the POC demo, it checks if the email belongs to a known
 * staff member and returns success (no actual email sent without
 * Neon Auth configured).
 */
export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Check if this email belongs to an active staff member
  const rows = await sql`
    select au.id, au.role, us.name
    from app_users au
    left join neon_auth.users_sync us on us.id = au.auth_user_id
    where lower(us.email) = lower(${email})
      and au.is_active
      and us.deleted_at is null
    limit 1`;

  if (!rows.length) {
    // Don't reveal whether the email exists
    // But still return success to prevent enumeration
    await auditLog("system", "login_attempt_unknown", "login_events", undefined, {
      email: email.substring(0, 3) + "***",
    });
    return NextResponse.json({ ok: true });
  }

  const user = rows[0];

  await auditLog(user.id as string, "login_link_requested", "login_events", user.id as string, {
    role: user.role,
  });

  // In production with Neon Auth configured:
  // await sendLoginLink(email);

  return NextResponse.json({ ok: true });
}
