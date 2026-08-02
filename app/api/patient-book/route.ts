import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { sendSms } from "@/lib/sms";
import { NextResponse } from "next/server";

/**
 * POST /api/patient-book
 * Patient books an appointment from the patient page.
 */
export async function POST(req: Request) {
  const { patient_id, order_id, center_id, slot_id } = await req.json();

  if (!patient_id || !order_id || !center_id || !slot_id) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Get slot details
  const slots = await sql`
    select slot_start, slot_end, capacity, booked
    from center_availability
    where id = ${slot_id}::uuid and booked < capacity`;

  if (!slots.length) {
    return NextResponse.json({ error: "slot no longer available" }, { status: 409 });
  }

  const slot = slots[0];

  // Count existing appointments for this order
  const countRows = await sql`
    select coalesce(max(visit_number), 0) as max_visit
    from appointments where order_id = ${order_id}::uuid`;
  const nextVisit = (countRows[0].max_visit as number) + 1;

  // Create appointment
  const apptRows = await sql`
    insert into appointments (order_id, patient_id, center_id, scheduled_start, scheduled_end,
                              visit_number, status, status_source)
    values (${order_id}::uuid, ${patient_id}::uuid, ${center_id}::uuid,
            ${slot.slot_start}, ${slot.slot_end}, ${nextVisit}, 'confirmed', 'patient_reported')
    returning id`;

  // Increment booked count
  await sql`
    update center_availability set booked = booked + 1 where id = ${slot_id}::uuid`;

  // Update order status if needed
  await sql`
    update orders set status = 'scheduled'
    where id = ${order_id}::uuid and status in ('matching', 'contacting_patient', 'received')`;

  await auditLog("patient", "appointment_booked", "appointments", apptRows[0].id as string, {
    patient_id, order_id, center_id, slot_start: slot.slot_start,
  });

  // Get details for confirmation SMS
  const details = await sql`
    select p.first_name, p.phone, p.preferred_language,
           c.name as center_name, c.address_line1
    from patients p, pt_centers c
    where p.id = ${patient_id}::uuid and c.id = ${center_id}::uuid`;

  if (details.length) {
    const d = details[0];
    const lang = d.preferred_language as string;
    const dateStr = new Date(slot.slot_start as string).toLocaleDateString("en-US", {
      weekday: "long", month: "short", day: "numeric",
    });
    const timeStr = new Date(slot.slot_start as string).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
    });

    await sendSms({
      patientId: patient_id,
      orderId: order_id,
      appointmentId: apptRows[0].id as string,
      phone: d.phone as string,
      body: lang === "es"
        ? `Cita confirmada! Visit #${nextVisit} en ${d.center_name}, ${d.address_line1}. ${dateStr} a las ${timeStr}. Confirmacion #TF-${(apptRows[0].id as string).slice(0, 5).toUpperCase()}`
        : `Appointment confirmed! Visit #${nextVisit} at ${d.center_name}, ${d.address_line1}. ${dateStr} at ${timeStr}. Confirmation #TF-${(apptRows[0].id as string).slice(0, 5).toUpperCase()}`,
      purpose: "confirmation",
    });
  }

  return NextResponse.json({ appointment_id: apptRows[0].id, visit_number: nextVisit });
}
