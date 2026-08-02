import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await sql`
    select p.id, p.first_name, p.last_name, p.dob, p.phone,
           p.preferred_language, p.preferred_channel,
           p.address_line1, p.city, p.state, p.zip,
           p.home_visit_ok, p.mobility_notes,
           py.name as payer_name, py.type as payer_type,
           pc.plan_name, pc.eligibility_status,
           pc.pt_visit_limit, pc.pt_visits_used, pc.copay_cents,
           pc.requires_auth
    from patients p
    left join patient_coverage pc on pc.patient_id = p.id and pc.is_primary
    left join payers py on py.id = pc.payer_id
    order by p.last_name, p.first_name`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    first_name, last_name, dob, phone, preferred_language, preferred_channel,
    address_line1, city, state, zip,
  } = body;

  const rows = await sql`
    insert into patients (first_name, last_name, dob, phone, preferred_language, preferred_channel,
                          address_line1, city, state, zip)
    values (${first_name}, ${last_name}, ${dob}, ${phone},
            ${preferred_language || "en"}, ${preferred_channel || "sms"},
            ${address_line1 || null}, ${city || null}, ${state || null}, ${zip || null})
    returning *`;

  await auditLog("demo_doctor", "patient_created", "patients", rows[0].id as string);

  return NextResponse.json(rows[0], { status: 201 });
}
export async function PUT(req: Request) {
  const body = await req.json();
  const {
    id, first_name, last_name, dob, phone, preferred_language,
    address_line1, city, state, zip, home_visit_ok,
  } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const rows = await sql`
    update patients set
      first_name = ${first_name},
      last_name = ${last_name},
      dob = ${dob},
      phone = ${phone},
      preferred_language = ${preferred_language || "en"},
      address_line1 = ${address_line1 || null},
      city = ${city || null},
      state = ${state || null},
      zip = ${zip || null},
      home_visit_ok = ${home_visit_ok || false}
    where id = ${id}::uuid
    returning *`;

  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });

  await auditLog("demo_doctor", "patient_updated", "patients", id);

  return NextResponse.json(rows[0]);
}