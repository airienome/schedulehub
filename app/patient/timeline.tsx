"use client";

import { useEffect, useState } from "react";

type PatientInfo = {
  first_name: string; last_name: string; phone: string;
  address_line1: string; city: string; state: string; zip: string;
};
type Order = {
  id: string; status: string; frequency_per_week: number; duration_weeks: number;
  total_visits_ordered: number; urgency: string; clinical_notes: string;
  diagnosis_codes: string[]; created_at: string;
  service_name: string; service_code: string;
  doctor_first: string; doctor_last: string;
  practice_name: string; practice_phone: string;
};
type Appointment = {
  id: string; order_id: string; scheduled_start: string; visit_number: number;
  status: string; is_home_visit: boolean;
  center_name: string; center_address: string; center_city: string;
  center_state: string; center_zip: string; center_phone: string;
};
type Message = {
  id: string; channel: string; direction: string; purpose: string;
  body: string; sent_at: string;
};
type CenterSlot = {
  id: string; name: string; address_line1: string; city: string; state: string; zip: string;
  phone: string; km: number; miles: number; offers_home_visits: boolean;
  rating: number; service_codes: string[] | null;
  lat: number; lng: number;
  slots: { slot_id: string; start: string; end: string }[];
};

const SPECIALTY_LABELS: Record<string, string> = {
  PT_ORTHO: "Ortho", PT_NEURO: "Neuro", PT_AQUATIC: "Aquatic", OT: "OT", PT_HOME: "Home",
};
const SPECIALTY_COLORS: Record<string, string> = {
  PT_ORTHO: "bg-peach/40 text-warm-800", PT_NEURO: "bg-lavender/20 text-lavender",
  PT_AQUATIC: "bg-sky/30 text-warm-800", OT: "bg-warm-100 text-warm-600", PT_HOME: "bg-olive/20 text-olive-dark",
};

export function PatientTimeline({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingCall, setRequestingCall] = useState(false);
  const [callRequested, setCallRequested] = useState(false);

  // Booking state
  const [bookingOrderId, setBookingOrderId] = useState<string | null>(null);
  const [centerSlots, setCenterSlots] = useState<CenterSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<CenterSlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ slot_id: string; start: string; end: string } | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ visit_number: number; appointment_id: string } | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [patientId]);

  const [error, setError] = useState<string | null>(null);

  function loadData() {
    fetch(`/api/patient-view?pid=${patientId}`).then(r => {
      if (!r.ok) throw new Error(`API error: ${r.status}`);
      return r.json();
    }).then(data => {
      if (data.error) { setError(data.error); setLoading(false); return; }
      if (data.patient) setPatient(data.patient);
      if (data.orders) setOrders(data.orders);
      if (data.appointments) setAppointments(data.appointments);
      if (data.messages) setMessages(data.messages);
      setLoading(false);
    }).catch(e => { setError(String(e)); setLoading(false); });
  }

  async function requestCall() {
    setRequestingCall(true);
    await fetch("/api/patient-request-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId }),
    });
    setCallRequested(true);
    setRequestingCall(false);
  }

  async function startBooking(orderId: string) {
    setBookingOrderId(orderId);
    setLoadingSlots(true);
    setBookingStep(1);
    setSelectedCenter(null);
    setSelectedSlot(null);
    setBookingResult(null);
    const res = await fetch(`/api/patient-slots?order_id=${orderId}&patient_id=${patientId}`);
    const data = await res.json();
    setCenterSlots(Array.isArray(data) ? data : []);
    setLoadingSlots(false);
  }

  function selectSlot(center: CenterSlot, slot: { slot_id: string; start: string; end: string }) {
    setSelectedCenter(center);
    setSelectedSlot(slot);
    setBookingStep(2);
  }

  async function confirmBooking() {
    if (!selectedCenter || !selectedSlot || !bookingOrderId) return;
    setBooking(true);
    const res = await fetch("/api/patient-book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, order_id: bookingOrderId, center_id: selectedCenter.id, slot_id: selectedSlot.slot_id }),
    });
    if (res.ok) {
      const result = await res.json();
      setBookingResult(result);
      setBookingStep(3);
      loadData();
    }
    setBooking(false);
  }

  function mapsUrl(address: string, city: string, state: string, zip: string) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)}`;
  }
  function fmtDate(d: string) { return new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
  function fmtTime(d: string) { return new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }

  // Timeout after 10s
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => { if (!patient) setError("Timed out loading. Please try again."); setLoading(false); }, 10000);
    return () => clearTimeout(t);
  }, [loading, patient]);

  if (loading && !patient) {
    return (<main className="flex flex-1 items-center justify-center"><div className="text-warm-400">Loading your information...</div></main>);
  }

  if (error && !patient) {
    return (<main className="flex flex-1 items-center justify-center p-8"><div className="text-center space-y-2"><div className="text-2xl">&#9888;</div><p className="text-warm-600 text-sm">Could not load your information.</p><p className="text-warm-400 text-xs">{error}</p><button onClick={() => { setError(null); setLoading(true); loadData(); }} className="mt-2 px-4 py-2 bg-sky text-warm-800 rounded-xl text-sm">Retry</button></div></main>);
  }

  const scheduledAppts = appointments.filter(a => ["scheduled", "confirmed"].includes(a.status) && new Date(a.scheduled_start) > new Date());
  const completedAppts = appointments.filter(a => a.status === "completed");
  const missedAppts = appointments.filter(a => a.status === "no_show");
  const remaining = (orderId: string) => {
    const o = orders.find(x => x.id === orderId);
    if (!o) return 0;
    const oa = appointments.filter(a => a.order_id === orderId);
    return (o.total_visits_ordered || 0) - oa.filter(a => a.status === "completed").length - oa.filter(a => ["scheduled","confirmed"].includes(a.status)).length;
  };

  return (
    <main className="max-w-lg mx-auto p-4 space-y-4 pb-12">
      {patient && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <img src="/favicon-source.png" alt="" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-semibold text-lg text-warm-900">Hi {patient.first_name} 👋</h1>
              <p className="text-xs text-warm-500">Your physical therapy coordination</p>
            </div>
          </div>
        </div>
      )}

      {orders.map(order => {
        const orderAppts = appointments.filter(a => a.order_id === order.id);
        const completed = orderAppts.filter(a => a.status === "completed").length;
        const sched = orderAppts.filter(a => ["scheduled","confirmed"].includes(a.status)).length;
        const rem = (order.total_visits_ordered || 0) - completed - sched;
        const isBookingThis = bookingOrderId === order.id;

        return (
          <div key={order.id} className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-warm-900">{order.service_name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.status === "in_progress" ? "bg-olive/20 text-olive-dark" : order.status === "scheduled" ? "bg-sky/30 text-warm-800" : "bg-warm-100 text-warm-500"}`}>{order.status.replace(/_/g, " ")}</span>
              </div>
              <p className="text-sm text-warm-500 mt-1">Prescribed by Dr. {order.doctor_last} at {order.practice_name}</p>
              <p className="text-xs text-warm-400 mt-0.5">{order.frequency_per_week}x/week for {order.duration_weeks} weeks ({order.total_visits_ordered} visits){order.urgency !== "routine" && <span className="text-pink ml-1">({order.urgency})</span>}</p>
              {order.clinical_notes && <p className="text-xs text-warm-400 mt-1 italic">{order.clinical_notes}</p>}
            </div>

            <div>
              <div className="flex justify-between text-xs text-warm-500 mb-1">
                <span>{completed} completed</span>
                <span>{rem > 0 ? `${rem} to schedule` : "All scheduled"}</span>
              </div>
              <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                <div className="h-full bg-olive rounded-full transition-all" style={{ width: `${(completed / (order.total_visits_ordered || 1)) * 100}%` }} />
              </div>
            </div>

            {rem > 0 && !isBookingThis && (
              <div className="bg-blush rounded-xl p-4 space-y-2">
                <p className="text-sm text-warm-600">{rem} visit{rem > 1 ? "s" : ""} still need to be scheduled</p>
                <div className="flex gap-2">
                  <button onClick={() => startBooking(order.id)} className="px-4 py-2 bg-sky text-warm-800 rounded-xl text-sm font-semibold hover:bg-sky-dark transition-colors">Book Online</button>
                  {!callRequested ? (
                    <button onClick={requestCall} disabled={requestingCall} className="px-4 py-2 border border-warm-300 rounded-xl text-sm text-warm-600 hover:bg-warm-50 transition-colors">{requestingCall ? "Calling you now..." : "Call Me Now"}</button>
                  ) : <span className="text-xs text-olive-dark self-center">Calling you now!</span>}
                </div>
              </div>
            )}

            {/* ===== STEP 1: Find a physical therapist (design-matched) ===== */}
            {isBookingThis && bookingStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-warm-900">Find a physical therapist</h3>
                  <button onClick={() => setBookingOrderId(null)} className="text-xs text-warm-400 hover:text-warm-600">Cancel</button>
                </div>
                <p className="text-xs text-warm-500">In-network clinics near you, sorted by distance. Tap a pin to jump to that clinic.</p>

                {/* Map */}
                {!loadingSlots && centerSlots.length > 0 && (() => {
                  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
                  const markers = centerSlots.filter(c => c.lat && c.lng).map((c, i) =>
                    `markers=color:${selectedCenter?.id === c.id ? "red" : "0xB2CFEE"}%7Clabel:${i + 1}%7C${c.lat},${c.lng}`
                  ).join("&");
                  const center = centerSlots[0];
                  const mapUrl = key
                    ? `https://maps.googleapis.com/maps/api/staticmap?size=600x200&maptype=roadmap&${markers}&key=${key}`
                    : null;
                  return mapUrl ? (
                    <img src={mapUrl} alt="Clinic locations" className="w-full h-40 object-cover rounded-xl border border-warm-200" />
                  ) : (
                    <div className="w-full h-32 bg-warm-100 rounded-xl border border-warm-200 flex items-center justify-center text-xs text-warm-400">
                      <a href={`https://maps.google.com/maps?q=${center.lat},${center.lng}&z=12`} target="_blank" rel="noopener noreferrer" className="text-pink hover:text-pink-dark">Open map in Google Maps &#8599;</a>
                    </div>
                  );
                })()}

                {loadingSlots ? <p className="text-sm text-warm-400 text-center py-8">Finding clinics near you...</p>
                : centerSlots.length === 0 ? <p className="text-sm text-warm-500 text-center py-8">No in-network clinics with open slots found. Request a call and we will help.</p>
                : centerSlots.map((center, idx) => (
                  <div key={center.id} id={`booking-center-${center.id}`}
                    className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 ${selectedCenter?.id === center.id ? "border-pink ring-2 ring-pink/20" : "border-warm-200"}`}>
                    {/* Clinic header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-sky text-warm-800 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                        <span className="font-semibold text-warm-900">{center.name}</span>
                      </div>
                      <span className="text-sm text-warm-500">&#9733; {center.rating}</span>
                    </div>

                    {/* Tags: specialty + distance */}
                    <div className="flex gap-1.5 flex-wrap">
                      {(center.service_codes || []).map(code => (
                        <span key={code} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SPECIALTY_COLORS[code] || "bg-warm-100 text-warm-500"}`}>
                          {SPECIALTY_LABELS[code] || code}
                        </span>
                      ))}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-warm-100 text-warm-500">{center.miles} mi</span>
                      {center.offers_home_visits && <span className="text-xs px-2 py-0.5 rounded-full bg-olive/20 text-olive-dark">Home visits</span>}
                    </div>

                    {/* Next available + spots + Book */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-warm-400">Next available</div>
                        <div className="font-bold text-sm text-warm-800">
                          {center.slots.length > 0 ? `${fmtDate(center.slots[0].start)} ${fmtTime(center.slots[0].start)}` : "No slots"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="w-11 h-11 rounded-full border-2 border-olive flex items-center justify-center font-bold text-olive-dark text-sm">
                            {center.slots.length}
                          </div>
                          <div className="text-[10px] text-warm-400 mt-0.5">spots</div>
                        </div>
                      </div>
                    </div>

                    {/* Time slots */}
                    {center.slots.length > 0 && (
                      <div>
                        <div className="text-xs text-warm-500 mb-2">Select a time:</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {center.slots.slice(0, 9).map(slot => (
                            <button key={slot.slot_id} onClick={() => selectSlot(center, slot)}
                              className="px-2 py-2 border border-warm-300 rounded-lg text-xs text-center hover:bg-pink hover:text-white hover:border-pink transition-colors">
                              <div className="font-medium">{fmtDate(slot.start)}</div>
                              <div>{fmtTime(slot.start)}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ===== STEP 2: Review & confirm (design-matched) ===== */}
            {isBookingThis && bookingStep === 2 && selectedCenter && selectedSlot && (
              <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-warm-900">Review &amp; confirm</h3>
                  <button onClick={() => setBookingStep(1)} className="text-xs text-warm-400 hover:text-warm-600">Back</button>
                </div>
                <div className="text-sm text-warm-700 leading-relaxed space-y-1">
                  <div className="font-semibold">{selectedCenter.name}</div>
                  <div className="font-bold text-warm-900">{fmtDate(selectedSlot.start)}, {fmtTime(selectedSlot.start)}</div>
                  <div className="text-warm-500">{selectedCenter.address_line1}, {selectedCenter.city}</div>
                </div>
                <a href={mapsUrl(selectedCenter.address_line1, selectedCenter.city, selectedCenter.state, selectedCenter.zip)} target="_blank" rel="noopener noreferrer" className="text-xs text-pink font-medium hover:text-pink-dark inline-block">View on Google Maps &#8599;</a>
                <button onClick={confirmBooking} disabled={booking} className="w-full py-3 bg-sky text-warm-800 rounded-xl font-bold text-sm hover:bg-sky-dark disabled:opacity-50 transition-colors">{booking ? "Booking..." : "Confirm Booking"}</button>
              </div>
            )}

            {/* ===== STEP 3: Booking confirmed (design-matched) ===== */}
            {isBookingThis && bookingStep === 3 && selectedCenter && selectedSlot && bookingResult && (
              <div className="bg-olive/10 rounded-2xl border border-olive/30 p-5 space-y-3">
                <h3 className="font-bold text-olive-dark">&#10003; Booking confirmed</h3>
                <div className="text-sm text-warm-700 leading-relaxed space-y-1">
                  <div>You&apos;re booked with {selectedCenter.name}</div>
                  <div className="font-bold text-warm-900">{fmtDate(selectedSlot.start)}, {fmtTime(selectedSlot.start)}</div>
                  <div className="text-warm-500">Confirmation #TF-{bookingResult.appointment_id.slice(0, 5).toUpperCase()}</div>
                </div>
                <div className="flex gap-2 pt-1">
                  <a href={mapsUrl(selectedCenter.address_line1, selectedCenter.city, selectedCenter.state, selectedCenter.zip)} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 border border-warm-300 bg-white rounded-xl text-xs font-medium text-warm-600 hover:bg-warm-50 transition-colors">
                    Get Directions
                  </a>
                  {remaining(order.id) > 1 && (
                    <button onClick={() => startBooking(order.id)}
                      className="px-4 py-2 bg-sky text-warm-800 rounded-xl text-xs font-semibold hover:bg-sky-dark transition-colors">
                      Book Another Visit
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {scheduledAppts.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-warm-900">Upcoming Appointments</h2>
          {scheduledAppts.map(appt => (
            <div key={appt.id} className="border border-warm-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-warm-900">Visit #{appt.visit_number}{appt.is_home_visit ? " (Home)" : ""}</div>
                  <div className="text-sm text-warm-700">{fmtDate(appt.scheduled_start)} at {fmtTime(appt.scheduled_start)}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${appt.status === "confirmed" ? "bg-olive/20 text-olive-dark" : "bg-sky/30 text-warm-800"}`}>{appt.status}</span>
              </div>
              <div className="bg-warm-50 rounded-lg p-2.5">
                <div className="font-medium text-xs text-warm-800">{appt.center_name}</div>
                <div className="text-xs text-warm-500">{appt.center_address}, {appt.center_city}</div>
                <div className="flex items-center gap-3 mt-1.5">
                  <a href={mapsUrl(appt.center_address, appt.center_city, appt.center_state, appt.center_zip)} target="_blank" rel="noopener noreferrer" className="text-xs text-pink font-medium hover:text-pink-dark">Google Maps &#8599;</a>
                  {appt.center_phone && <a href={`tel:${appt.center_phone}`} className="text-xs text-warm-500 hover:text-warm-700">{appt.center_phone}</a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {completedAppts.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-2">
          <h2 className="font-semibold text-warm-900">Completed ({completedAppts.length})</h2>
          {completedAppts.map(appt => (
            <div key={appt.id} className="flex items-center justify-between py-1.5 border-b border-warm-100 last:border-0">
              <div className="text-sm text-warm-600">Visit #{appt.visit_number} - {appt.center_name}</div>
              <span className="text-xs text-olive-dark">{fmtDate(appt.scheduled_start)}</span>
            </div>
          ))}
        </div>
      )}

      {missedAppts.length > 0 && (
        <div className="bg-peach/20 rounded-2xl border border-peach/40 p-5 space-y-2">
          <h2 className="font-semibold text-pink">Missed ({missedAppts.length})</h2>
          <p className="text-sm text-warm-600">These sessions were missed. Your recovery depends on consistent attendance.</p>
          {orders.length > 0 && <button onClick={() => startBooking(orders[0].id)} className="px-4 py-2 bg-pink text-white rounded-xl text-xs font-semibold hover:bg-pink-dark transition-colors">Schedule Make-up Visits</button>}
        </div>
      )}

      {messages.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-warm-900">Messages</h2>
          {messages.map(msg => (
            <div key={msg.id} className={`rounded-xl p-3 ${msg.direction === "inbound" ? "bg-sky/20 border border-sky/40 ml-6" : "bg-warm-50 border border-warm-200 mr-6"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${msg.channel === "voice" ? "bg-lavender/15 text-lavender" : "bg-sky/30 text-warm-700"}`}>
                    {msg.channel === "voice" ? "Call" : "SMS"}
                  </span>
                  <span className="text-[11px] font-medium text-warm-600">
                    {msg.channel === "voice" ? "Phone call" : msg.direction === "outbound" ? "TherapyFlow" : "You"}
                  </span>
                </div>
                <span className="text-[10px] text-warm-400 whitespace-nowrap">
                  {new Date(msg.sent_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} {new Date(msg.sent_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <p className="text-xs text-warm-700 break-words whitespace-pre-wrap leading-relaxed">{msg.body}</p>
            </div>
          ))}
        </div>
      )}

      {orders.length === 0 && <div className="text-center py-8 text-warm-400"><p className="text-sm">No prescriptions found.</p></div>}
      <p className="text-center text-xs text-warm-300">This link expires after 30 minutes.</p>
    </main>
  );
}
