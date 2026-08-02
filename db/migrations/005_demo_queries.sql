-- ============================================================
-- DEMO QUERY 1: The Matching Engine
-- For a given order, rank centers by: service offered,
-- in-network (fresh verification preferred), distance,
-- and whether they have slots inside the patient's windows.
-- ============================================================

with target as (
  select o.id as order_id, o.patient_id, o.service_type_id,
         p.geom as patient_geom, pc.payer_id
  from orders o
  join patients p on p.id = o.patient_id
  join patient_coverage pc on pc.patient_id = p.id and pc.is_primary
  where o.id = '90000000-0000-0000-0000-000000000003'   -- Amanda
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
  c.name,
  c.city,
  round((ST_Distance(c.geom, t.patient_geom) / 1000.0)::numeric, 1) as km,
  cnp.in_network,
  cnp.verified_via,
  round(extract(epoch from (now() - cnp.verified_at)) / 86400) as verified_days_ago,
  coalesce(sf.matching_slots, 0) as slots_in_window,
  to_char(sf.earliest_slot, 'Dy MM/DD HH24:MI') as earliest,
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
order by score desc;

-- ============================================================
-- DEMO QUERY 2: Adherence Dashboard
-- Expected visits (from regimen) vs completed, per active order.
-- ============================================================

select
  pt.first_name || ' ' || pt.last_name as patient,
  st.code as service,
  pr.last_name as ordering_md,
  o.frequency_per_week || 'x/wk for ' || o.duration_weeks || 'wk' as regimen,
  least(
    floor(extract(epoch from (now() - o.created_at)) / 604800) * o.frequency_per_week,
    o.total_visits_ordered
  )::int as visits_expected,
  count(*) filter (where a.status = 'completed') as completed,
  count(*) filter (where a.status = 'no_show') as no_shows,
  case
    when count(*) filter (where a.status = 'completed') = 0 then 0
    else round(100.0 * count(*) filter (where a.status = 'completed')
         / greatest(least(
             floor(extract(epoch from (now() - o.created_at)) / 604800) * o.frequency_per_week,
             o.total_visits_ordered), 1))
  end as adherence_pct,
  case
    when count(*) filter (where a.status = 'no_show'
         and a.scheduled_start > now() - interval '10 days') >= 2 then 'FALLEN OFF'
    when count(*) filter (where a.status = 'completed')
         < 0.8 * least(floor(extract(epoch from (now() - o.created_at)) / 604800)
                        * o.frequency_per_week, o.total_visits_ordered) then 'at risk'
    else 'on track'
  end as risk
from orders o
join patients pt on pt.id = o.patient_id
join providers pr on pr.id = o.provider_id
join service_types st on st.id = o.service_type_id
left join appointments a on a.order_id = o.id
where o.status = 'in_progress'
group by pt.first_name, pt.last_name, st.code, pr.last_name,
         o.frequency_per_week, o.duration_weeks, o.total_visits_ordered, o.created_at
order by adherence_pct;
