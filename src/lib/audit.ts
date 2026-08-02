import { sql } from "@/lib/db";

export async function auditLog(
  actor: string,
  action: string,
  entityType: string,
  entityId?: string,
  detail?: Record<string, unknown>
) {
  await sql`
    insert into audit_log (actor, action, entity_type, entity_id, detail)
    values (
      ${actor},
      ${action},
      ${entityType},
      ${entityId ?? null}::uuid,
      ${detail ? JSON.stringify(detail) : null}::jsonb
    )`;
}
