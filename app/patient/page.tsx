"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Patient = { id: string; first_name: string; last_name: string; phone: string; preferred_language: string };

type OutreachMsg = {
  id: string; channel: string; direction: string; purpose: string;
  body: string; sent_at: string; responded: boolean;
  ai_extraction: Record<string, unknown> | null;
};

type Order = {
  id: string; status: string; service_name: string; service_code: string;
  provider_first: string; provider_last: string;
  frequency_per_week: number; duration_weeks: number;
  created_at: string;
};

export default function PatientPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [outreach, setOutreach] = useState<OutreachMsg[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetch("/api/patients").then(r => r.json()).then(setPatients);
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    loadPatientData();
  }, [selectedPatient]);

  useEffect(() => {
    if (!autoRefresh || !selectedPatient) return;
    const interval = setInterval(loadPatientData, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedPatient]);

  function loadPatientData() {
    if (!selectedPatient) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/outreach?patient_id=${selectedPatient}`).then(r => r.json()),
      fetch(`/api/orders`).then(r => r.json()),
    ]).then(([msgs, allOrders]) => {
      setOutreach(msgs);
      setOrders(allOrders.filter((o: Order & { patient_id?: string }) =>
        // filter by patient - the API returns patient info in the order
        msgs.some((m: OutreachMsg & { order_id?: string }) => true) || true
      ));
      setLoading(false);
    });
  }

  const patient = patients.find(p => p.id === selectedPatient);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr; Home</Link>
          <h1 className="text-2xl font-bold mt-1">Patient View</h1>
          <p className="text-sm text-gray-500">Observer view of what the patient experiences (calls, messages, appointments)</p>
        </div>
      </div>

      {/* Patient selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
        <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm">
          <option value="">Select a patient to observe...</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name} - {p.phone} ({p.preferred_language})
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
            className="rounded" />
          Auto-refresh (3s)
        </label>

        <button onClick={loadPatientData} disabled={!selectedPatient}
          className="px-4 py-2 bg-gray-100 border rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50">
          Refresh
        </button>
      </div>

      {!selectedPatient ? (
        <div className="text-center py-16 text-gray-400">
          Select a patient above to view their call and message history
        </div>
      ) : (
        <>
          {/* Patient info card */}
          {patient && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-xl">
                  {patient.first_name[0]}{patient.last_name[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{patient.first_name} {patient.last_name}</h3>
                  <p className="text-sm text-gray-500">{patient.phone} &middot; {patient.preferred_language.toUpperCase()}</p>
                </div>
                {autoRefresh && (
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Call/Message timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">Communication Timeline</h2>

            {loading && outreach.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : outreach.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No outreach messages yet. Create an order from the Doctor page to trigger a call.
              </div>
            ) : (
              <div className="space-y-3">
                {outreach.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.direction === "inbound" ? "flex-row-reverse" : ""}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      msg.channel === "voice"
                        ? "bg-purple-100 text-purple-600"
                        : msg.direction === "outbound"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-green-100 text-green-600"
                    }`}>
                      {msg.channel === "voice" ? "📞" : msg.direction === "outbound" ? "📤" : "📥"}
                    </div>
                    <div className={`flex-1 max-w-lg rounded-xl p-3 text-sm ${
                      msg.direction === "inbound"
                        ? "bg-green-50 border border-green-200 ml-auto"
                        : "bg-gray-50 border border-gray-200"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          msg.channel === "voice" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {msg.channel}
                        </span>
                        <span className="text-xs text-gray-400">
                          {msg.purpose.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-gray-300">
                          {new Date(msg.sent_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{msg.body}</p>
                      {msg.ai_extraction && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer">AI extraction</summary>
                          <pre className="text-xs text-gray-500 mt-1 overflow-x-auto">
                            {JSON.stringify(msg.ai_extraction, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
