import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/patient-slots?order_id=...&patient_id=...
 * Returns matched centers with available slots for the patient to pick from.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");
  const patientId = searchParams.get("patient_id");

  if (!orderId || !patientId) {
    return NextResponse.json({ error: "order_id and patient_id required" }, { status: 400 });
  }

  // Get top matched centers for this order (in-network, nearby, with slots)
  const centers = await sql`
    select c.id, c.name, c.address_line1, c.city, c.state, c.zip, c.phone,
           c.offers_home_visits, c.rating,
           ST_Y(c.geom::geometry) as lat, ST_X(c.geom::geometry) as lng,
           round((ST_Distance(c.geom, p.geom) / 1000.0)::numeric, 1) as km,
           round((ST_Distance(c.geom, p.geom) / 1609.0)::numeric, 1) as miles,
           array_agg(distinct st2.code) filter (where st2.code is not null) as service_codes
    from orders o
    join patients p on p.id = o.patient_id
    join patient_coverage pc on pc.patient_id = p.id and pc.is_primary
    join center_services cs on cs.service_type_id = o.service_type_id
    join pt_centers c on c.id = cs.center_id
    join center_network_participation cnp on cnp.center_id = c.id and cnp.payer_id = pc.payer_id
    left join center_services cs2 on cs2.center_id = c.id
    left join service_types st2 on st2.id = cs2.service_type_id
    where o.id = ${orderId}::uuid
      and cnp.in_network
      and c.onboarded
    group by c.id, p.geom
    order by ST_Distance(c.geom, p.geom)
    limit 5`;

  // Get available slots for next 7 days for these centers
  const centerIds = centers.map((c: Record<string, unknown>) => c.id as string);
  
  let slots: Record<string, unknown>[] = [];
  if (centerIds.length > 0) {
    slots = await sql`
      select ca.id as slot_id, ca.center_id, ca.slot_start, ca.slot_end,
             ca.capacity, ca.booked
      from center_availability ca
      where ca.center_id = ANY(${centerIds}::uuid[])
        and ca.slot_start > now()
        and ca.slot_start < now() + interval '7 days'
        and ca.booked < ca.capacity
      order by ca.slot_start`;
  }

  // Group slots by center
  const result = centers.map((c: Record<string, unknown>) => ({
    ...c,
    slots: slots
      .filter(s => s.center_id === c.id)
      .map(s => ({
        slot_id: s.slot_id,
        start: s.slot_start,
        end: s.slot_end,
      })),
  }));

  return NextResponse.json(result);
}
