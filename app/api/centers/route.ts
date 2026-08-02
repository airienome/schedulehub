import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await sql`
    select c.id, c.name, c.phone, c.email, c.address_line1, c.city, c.state, c.zip,
           c.offers_home_visits, c.home_visit_radius_km, c.scheduling_mode,
           c.ehr_system, c.onboarded, c.rating,
           array_agg(distinct st.name) filter (where st.name is not null) as services,
           array_agg(distinct py.name) filter (where cnp.in_network) as in_network_payers
    from pt_centers c
    left join center_services cs on cs.center_id = c.id
    left join service_types st on st.id = cs.service_type_id
    left join center_network_participation cnp on cnp.center_id = c.id and cnp.in_network
    left join payers py on py.id = cnp.payer_id
    group by c.id
    order by c.onboarded desc, c.rating desc nulls last`;
  return NextResponse.json(rows);
}
