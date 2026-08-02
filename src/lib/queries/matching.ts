import { sql } from "@/lib/db";

/**
 * Rank PT centers for a given order by:
 * service offered, in-network status (freshness matters),
 * distance from patient, and slot fit with patient windows.
 */
export async function rankCentersForOrder(orderId: string) {
  return sql`
    with target as (
      select o.id as order_id, o.patient_id, o.service_type_id,
             p.geom as patient_geom, pc.payer_id
      from orders o
      join patients p on p.id = o.patient_id
      join patient_coverage pc on pc.patient_id = p.id and pc.is_primary
      where o.id = ${orderId}::uuid
    ),
    slot_fit as (
      select ca.center_id, count(*) as matching_slots,
             min(ca.slot_start) as earliest_slot
      from center_availability ca
      join target t on true
      join patient_availability pa
        on pa.order_id = t.order_id
       and pa.day_of_week = extract(dow from ca.slot_start)
       and ca.slot_start::time >= pa.window_start
       and ca.slot_start::time <  pa.window_end
      where ca.booked < ca.capacity
        and ca.slot_start > now()
      group by ca.center_id
    )
    select
      c.id,
      c.name,
      c.city,
      c.address_line1,
      c.phone,
      round((ST_Distance(c.geom, t.patient_geom) / 1000.0)::numeric, 1) as km,
      cnp.in_network,
      cnp.verified_via,
      round(extract(epoch from (now() - cnp.verified_at)) / 86400) as verified_days_ago,
      coalesce(sf.matching_slots, 0)::int as slots_in_window,
      to_char(sf.earliest_slot, 'Dy MM/DD HH24:MI') as earliest,
      sf.earliest_slot,
      round((
          (1.0 - least(ST_Distance(c.geom, t.patient_geom) / 30000.0, 1.0)) * 0.4
        + (case when cnp.in_network then 0.3 else 0 end)
        + (case when cnp.verified_at > now() - interval '30 days' then 0.1 else 0 end)
        + (case when coalesce(sf.matching_slots,0) > 0 then 0.2 else 0 end)
      )::numeric, 2) as score
    from target t
    join center_services cs on cs.service_type_id = t.service_type_id
    join pt_centers c on c.id = cs.center_id
    left join center_network_participation cnp
           on cnp.center_id = c.id and cnp.payer_id = t.payer_id
    left join slot_fit sf on sf.center_id = c.id
    where coalesce(cnp.in_network, false)
    order by score desc`;
}
