import { sql } from "@/lib/db";

/**
 * Adherence dashboard: expected visits vs completed per active order.
 * Optionally scoped to a single practice.
 */
export async function getAdherenceDashboard(practiceId?: string) {
  if (practiceId) {
    return sql`
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
        end as risk,
        o.id as order_id,
        pt.id as patient_id
      from orders o
      join patients pt on pt.id = o.patient_id
      join providers pr on pr.id = o.provider_id
      join service_types st on st.id = o.service_type_id
      left join appointments a on a.order_id = o.id
      where o.status = 'in_progress'
        and o.practice_id = ${practiceId}::uuid
      group by pt.first_name, pt.last_name, st.code, pr.last_name,
               o.frequency_per_week, o.duration_weeks, o.total_visits_ordered, o.created_at,
               o.id, pt.id
      order by adherence_pct`;
  }

  return sql`
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
      end as risk,
      o.id as order_id,
      pt.id as patient_id
    from orders o
    join patients pt on pt.id = o.patient_id
    join providers pr on pr.id = o.provider_id
    join service_types st on st.id = o.service_type_id
    left join appointments a on a.order_id = o.id
    where o.status = 'in_progress'
    group by pt.first_name, pt.last_name, st.code, pr.last_name,
             o.frequency_per_week, o.duration_weeks, o.total_visits_ordered, o.created_at,
             o.id, pt.id
    order by adherence_pct`;
}
