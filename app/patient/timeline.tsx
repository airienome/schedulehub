"use client";

import { useEffect, useState } from "react";

type PatientInfo = { first_name: string; last_name: string; phone: string };

type OutreachMsg = {
  id: string; channel: string; direction: string; purpose: string;
  body: string; sent_at: string; responded: boolean;
  ai_extraction: Record<string, unknown> | null;
};

type Appointment = {
  id: string; scheduled_start: string; visit_number: number;
  status: string; center_name: string; is_home_visit: boolean;
};

export function PatientTimeline({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [outreach, setOutreach] = useState<OutreachMsg[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [patientId]);

  function loadData() {
    Promise.all([
      fetch(`/api/patient-view?pid=${patientId}`).then(r => r.json()),
    ]).then(([data]) => {
      setPatient(data.patient);
      setOutreach(data.messages);
      setAppointments(data.appointments);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  if (loading && !patient) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-warm-400">Loading your information...</div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto p-4 space-y-4">
      {/* Patient header - mobile friendly */}
      {patient && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4">
          <h1 className="font-semibold text-lg">
            Hi {patient.first_name} 👋
          </h1>
          <p className="text-sm text-warm-500 mt-1">
            Here is your physical therapy coordination status.
          </p>
        </div>
      )}

      {/* Upcoming appointments */}
      {appointments.length > 0 && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4">
          <h2 className="font-medium text-sm text-warm-500 uppercase tracking-wide mb-3">
            Your Appointments
          </h2>
          <div className="space-y-2">
            {appointments.map(appt => (
              <div key={appt.id} className="flex items-center justify-between p-3 bg-warm-50 rounded-xl">
                <div>
                  <div className="font-medium text-sm">
                    Visit #{appt.visit_number}
                    {appt.is_home_visit && " (Home Visit)"}
                  </div>
                  <div className="text-xs text-warm-500">
                    {appt.center_name}
                  </div>
                  <div className="text-xs text-warm-400">
                    {new Date(appt.scheduled_start).toLocaleDateString(undefined, {
                      weekday: "long", month: "short", day: "numeric",
                    })} at {new Date(appt.scheduled_start).toLocaleTimeString(undefined, {
                      hour: "numeric", minute: "2-digit",
                    })}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  appt.status === "confirmed" ? "bg-olive/20 text-olive-dark" :
                  appt.status === "scheduled" ? "bg-sky/30 text-warm-800" :
                  appt.status === "completed" ? "bg-warm-100 text-warm-600" :
                  "bg-peach/30 text-warm-700"
                }`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message history */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4">
        <h2 className="font-medium text-sm text-warm-500 uppercase tracking-wide mb-3">
          Messages
        </h2>

        {outreach.length === 0 ? (
          <p className="text-sm text-warm-400 text-center py-4">
            No messages yet. We will reach out shortly.
          </p>
        ) : (
          <div className="space-y-2">
            {outreach.map(msg => (
              <div key={msg.id} className={`rounded-xl p-3 text-sm ${
                msg.direction === "inbound"
                  ? "bg-blue-50 border border-blue-200 ml-8"
                  : "bg-warm-50 border border-warm-200 mr-8"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-warm-400">
                    {msg.channel === "voice" ? "📞 Call" : "💬 Text"}
                  </span>
                  <span className="text-xs text-warm-300">
                    {new Date(msg.sent_at).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-warm-700">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-warm-300 pb-4">
        This link expires after 30 minutes.
      </p>
    </main>
  );
}
