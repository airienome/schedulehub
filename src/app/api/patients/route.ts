import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await sql`
    select id, first_name, last_name, dob, phone, preferred_language, preferred_channel,
           address_line1, city, state, zip, home_visit_ok
    from patients
    order by last_name, first_name`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { first_name, last_name, dob, phone, preferred_language, preferred_channel } = body;

  const rows = await sql`
    insert into patients (first_name, last_name, dob, phone, preferred_language, preferred_channel)
    values (${first_name}, ${last_name}, ${dob}, ${phone},
            ${preferred_language || "en"}, ${preferred_channel || "sms"})
    returning *`;

  await auditLog("demo_doctor", "patient_created", "patients", rows[0].id as string);

  return NextResponse.json(rows[0], { status: 201 });
}
