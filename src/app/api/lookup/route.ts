import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  switch (type) {
    case "providers": {
      const practiceId = searchParams.get("practice_id");
      const rows = practiceId
        ? await sql`select id, first_name, last_name, specialty from providers where practice_id = ${practiceId}::uuid order by last_name`
        : await sql`select id, first_name, last_name, specialty, practice_id from providers order by last_name`;
      return NextResponse.json(rows);
    }

    case "practices": {
      const rows = await sql`select id, name, city from practices order by name`;
      return NextResponse.json(rows);
    }

    case "service_types": {
      const rows = await sql`select id, code, name from service_types order by name`;
      return NextResponse.json(rows);
    }

    case "payers": {
      const rows = await sql`select id, name, type from payers order by name`;
      return NextResponse.json(rows);
    }

    default:
      return NextResponse.json({ error: "unknown type" }, { status: 400 });
  }
}
