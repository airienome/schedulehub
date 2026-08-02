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

export function PatientTimeline({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingCall, setRequestingCall] = useState(false);
  const [callRequested, setCallRequested] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [patientId]);

  function loadData() {
    fetch(`/api/patient-view?pid=${patientId}`).then(r => r.json()).then(data => {
      if (data.patient) setPatient(data.patient);
      if (data.orders) setOrders(data.orders);
      if (data.appointments) setAppointments(data.appointments);
      if (data.messages) setMessages(data.messages);
      setLoading(false);
    }).catch(() => setLoading(false));
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

  if (loading && !patient) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-warm-400">Loading your information...</div>
      </main>
    );
  }

  function mapsUrl(address: string, city: string, state: string, zip: string) {
    const q = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
    return `https://maps.google.com/maps?q=${q}`;
  }

  const scheduledAppts = appointments.filter(a => ["scheduled", "confirmed"].includes(a.status) && new Date(a.scheduled_start) > new Date());
  const completedAppts = appointments.filter(a => a.status === "completed");
  const missedAppts = appointments.filter(a => a.status === "no_show");

  return (
    <main className="max-w-lg mx-auto p-4 space-y-4 pb-12">
      {/* Header */}
      {patient && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <img src="/favicon-source.png" alt="" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-semibold text-lg text-warm-900">
                Hi {patient.first_name} 👋
              </h1>
              <p className="text-xs text-warm-500">Your physical therapy coordination</p>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions */}
      {orders.map(order => {
        const orderAppts = appointments.filter(a => a.order_id === order.id);
        const completed = orderAppts.filter(a => a.status === "completed").length;
        const scheduled = orderAppts.filter(a => ["scheduled", "confirmed"].includes(a.status)).length;
        const remaining = (order.total_visits_ordered || 0) - completed - scheduled;

        return (
          <div key={order.id} className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-warm-900">{order.service_name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  order.status === "in_progress" ? "bg-olive/20 text-olive-dark" :
                  order.status === "scheduled" ? "bg-sky/30 text-warm-800" :
                  order.status === "contacting_patient" || order.status === "matching" ? "bg-lavender/15 text-lavender" :
                  "bg-warm-100 text-warm-500"
                }`}>{order.status.replace(/_/g, " ")}</span>
              </div>
              <p className="text-sm text-warm-500 mt-1">
                Prescribed by Dr. {order.doctor_last} at {order.practice_name}
              </p>
              <p className="text-xs text-warm-400 mt-0.5">
                {order.frequency_per_week}x/week for {order.duration_weeks} weeks
                ({order.total_visits_ordered} total visits)
                {order.urgency !== "routine" && <span className="text-pink ml-1">({order.urgency})</span>}
              </p>
              {order.clinical_notes && (
                <p className="text-xs text-warm-400 mt-1 italic">{order.clinical_notes}</p>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-warm-500 mb-1">
                <span>{completed} completed</span>
                <span>{remaining > 0 ? `${remaining} remaining` : "All scheduled"}</span>
              </div>
              <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                <div className="h-full bg-olive rounded-full transition-all"
                  style={{ width: `${(completed / (order.total_visits_ordered || 1)) * 100}%` }} />
              </div>
            </div>

            {/* Request call for remaining visits */}
            {remaining > 0 && order.status !== "contacting_patient" && (
              <div className="bg-blush rounded-xl p-3 text-center">
                {callRequested ? (
                  <p className="text-sm text-olive-dark font-medium">
                    Call requested! We will reach out shortly.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-warm-600 mb-2">
                      {remaining} visit{remaining > 1 ? "s" : ""} still need to be scheduled
                    </p>
                    <button onClick={requestCall} disabled={requestingCall}
                      className="px-5 py-2 bg-pink text-white rounded-xl text-sm font-semibold hover:bg-pink-dark disabled:opacity-50 transition-colors">
                      {requestingCall ? "Requesting..." : "Request a Call to Schedule"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Upcoming Appointments */}
      {scheduledAppts.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-warm-900">Upcoming Appointments</h2>
          {scheduledAppts.map(appt => (
            <div key={appt.id} className="border border-warm-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-warm-900">
                    Visit #{appt.visit_number} {appt.is_home_visit ? "(Home Visit)" : ""}
                  </div>
                  <div className="text-sm text-warm-700">
                    {new Date(appt.scheduled_start).toLocaleDateString(undefined, {
                      weekday: "long", month: "short", day: "numeric",
                    })} at {new Date(appt.scheduled_start).toLocaleTimeString(undefined, {
                      hour: "numeric", minute: "2-digit",
                    })}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  appt.status === "confirmed" ? "bg-olive/20 text-olive-dark" : "bg-sky/30 text-warm-800"
                }`}>{appt.status}</span>
              </div>

              {/* Center info + map */}
              <div className="bg-warm-50 rounded-lg p-2.5">
                <div className="font-medium text-xs text-warm-800">{appt.center_name}</div>
                <div className="text-xs text-warm-500">{appt.center_address}, {appt.center_city}</div>
                <div className="flex items-center gap-3 mt-1.5">
                  <a href={mapsUrl(appt.center_address, appt.center_city, appt.center_state, appt.center_zip)}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-pink font-medium hover:text-pink-dark">
                    Open in Google Maps &#8599;
                  </a>
                  {appt.center_phone && (
                    <a href={`tel:${appt.center_phone}`} className="text-xs text-warm-500 hover:text-warm-700">
                      {appt.center_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed visits */}
      {completedAppts.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-2">
          <h2 className="font-semibold text-warm-900">Completed Visits ({completedAppts.length})</h2>
          {completedAppts.map(appt => (
            <div key={appt.id} className="flex items-center justify-between py-1.5 border-b border-warm-100 last:border-0">
              <div className="text-sm text-warm-600">
                Visit #{appt.visit_number} - {appt.center_name}
              </div>
              <span className="text-xs text-olive-dark">
                {new Date(appt.scheduled_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Missed visits */}
      {missedAppts.length > 0 && (
        <div className="bg-peach/20 rounded-2xl border border-peach/40 p-5 space-y-2">
          <h2 className="font-semibold text-pink">Missed Visits ({missedAppts.length})</h2>
          <p className="text-sm text-warm-600">
            These sessions were missed. Your recovery depends on consistent attendance.
          </p>
          {!callRequested && (
            <button onClick={requestCall} disabled={requestingCall}
              className="px-4 py-2 bg-pink text-white rounded-xl text-xs font-semibold hover:bg-pink-dark disabled:opacity-50 transition-colors">
              Schedule Make-up Visits
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-warm-900">Messages</h2>
          {messages.slice(0, 5).map(msg => (
            <div key={msg.id} className={`rounded-xl p-3 text-sm ${
              msg.direction === "inbound"
                ? "bg-sky/20 border border-sky/40 ml-8"
                : "bg-warm-50 border border-warm-200 mr-8"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-warm-400">
                  {msg.channel === "voice" ? "Phone call" : msg.direction === "outbound" ? "TherapyFlow" : "You"}
                </span>
                <span className="text-xs text-warm-300">
                  {new Date(msg.sent_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-warm-700">{msg.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* No data state */}
      {orders.length === 0 && (
        <div className="text-center py-8 text-warm-400">
          <p className="text-sm">No prescriptions found. We will contact you when your doctor sends a referral.</p>
        </div>
      )}

      <p className="text-center text-xs text-warm-300">
        This link expires after 30 minutes. Your data is secure.
      </p>
    </main>
  );
}
