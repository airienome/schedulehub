"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LookupItem = { id: string; first_name?: string; last_name?: string; name?: string; code?: string; specialty?: string };
type Patient = { id: string; first_name: string; last_name: string; phone: string; preferred_language: string };
type AdherenceRow = {
  patient: string; service: string; ordering_md: string; regimen: string;
  visits_expected: number; completed: number; no_shows: number;
  adherence_pct: number; risk: string; order_id: string;
};

export default function DoctorPage() {
  const [practices, setPractices] = useState<LookupItem[]>([]);
  const [providers, setProviders] = useState<LookupItem[]>([]);
  const [serviceTypes, setServiceTypes] = useState<LookupItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [adherence, setAdherence] = useState<AdherenceRow[]>([]);

  const [practiceId, setPracticeId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [frequency, setFrequency] = useState(3);
  const [weeks, setWeeks] = useState(6);
  const [reeval, setReeval] = useState(14);
  const [urgency, setUrgency] = useState("routine");
  const [notes, setNotes] = useState("");
  const [diagCodes, setDiagCodes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ first_name: "", last_name: "", dob: "", phone: "", preferred_language: "en" });

  useEffect(() => {
    fetch("/api/lookup?type=practices").then(r => r.json()).then(setPractices);
    fetch("/api/lookup?type=service_types").then(r => r.json()).then(setServiceTypes);
    fetch("/api/patients").then(r => r.json()).then(setPatients);
  }, []);

  useEffect(() => {
    if (practiceId) {
      fetch(`/api/lookup?type=providers&practice_id=${practiceId}`).then(r => r.json()).then(setProviders);
      fetch(`/api/adherence?practice_id=${practiceId}`).then(r => r.json()).then(setAdherence);
    }
  }, [practiceId]);

  async function createPatient() {
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPatient),
    });
    const p = await res.json();
    setPatients(prev => [...prev, p]);
    setPatientId(p.id);
    setShowNewPatient(false);
    setNewPatient({ first_name: "", last_name: "", dob: "", phone: "", preferred_language: "en" });
  }

  async function submitOrder() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          practice_id: practiceId,
          patient_id: patientId,
          service_type_id: serviceTypeId,
          diagnosis_codes: diagCodes ? diagCodes.split(",").map(s => s.trim()) : [],
          frequency_per_week: frequency,
          duration_weeks: weeks,
          total_visits_ordered: frequency * weeks,
          reeval_interval_days: reeval,
          urgency,
          clinical_notes: notes,
        }),
      });
      if (res.ok) {
        setResult("Order created. Calling patient now...");
      } else {
        const err = await res.text();
        setResult(`Error: ${err}`);
      }
    } catch (e) {
      setResult(`Error: ${e}`);
    }
    setSubmitting(false);
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr; Home</Link>
          <h1 className="text-2xl font-bold mt-1">Doctor Portal</h1>
          <p className="text-sm text-gray-500">Create a PT referral order. The system will call the patient immediately.</p>
        </div>
      </div>

      {/* Order form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-lg">New PT Order</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Practice</label>
            <select value={practiceId} onChange={e => setPracticeId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select practice...</option>
              {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordering Provider</label>
            <select value={providerId} onChange={e => setProviderId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" disabled={!practiceId}>
              <option value="">Select provider...</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>Dr. {p.last_name} ({p.specialty})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
          <div className="flex gap-2">
            <select value={patientId} onChange={e => setPatientId(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm">
              <option value="">Select patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} - {p.phone} ({p.preferred_language})
                </option>
              ))}
            </select>
            <button onClick={() => setShowNewPatient(!showNewPatient)}
              className="px-3 py-2 bg-gray-100 border rounded-lg text-sm hover:bg-gray-200">
              + New
            </button>
          </div>
        </div>

        {showNewPatient && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <h3 className="text-sm font-medium">Add New Patient</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="First name" value={newPatient.first_name}
                onChange={e => setNewPatient({ ...newPatient, first_name: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Last name" value={newPatient.last_name}
                onChange={e => setNewPatient({ ...newPatient, last_name: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm" />
              <input type="date" placeholder="DOB" value={newPatient.dob}
                onChange={e => setNewPatient({ ...newPatient, dob: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Phone (305-555-1234)" value={newPatient.phone}
                onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm" />
              <select value={newPatient.preferred_language}
                onChange={e => setNewPatient({ ...newPatient, preferred_language: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="ht">Haitian Creole</option>
              </select>
            </div>
            <button onClick={createPatient}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Add Patient
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select value={serviceTypeId} onChange={e => setServiceTypeId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select service...</option>
              {serviceTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <select value={urgency} onChange={e => setUrgency(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="post_op">Post-Op</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency (per week)</label>
            <input type="number" value={frequency} onChange={e => setFrequency(+e.target.value)}
              min={1} max={7} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
            <input type="number" value={weeks} onChange={e => setWeeks(+e.target.value)}
              min={1} max={52} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Re-eval interval (days)</label>
            <input type="number" value={reeval} onChange={e => setReeval(+e.target.value)}
              min={7} max={90} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Codes (comma-separated)</label>
          <input value={diagCodes} onChange={e => setDiagCodes(e.target.value)}
            placeholder="M75.101, S83.512D" className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={2} className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Relevant clinical context..." />
        </div>

        <div className="flex items-center gap-4">
          <button onClick={submitOrder}
            disabled={submitting || !practiceId || !providerId || !patientId || !serviceTypeId}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? "Creating order..." : "Create Order & Call Patient"}
          </button>
          {result && (
            <p className={`text-sm ${result.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
              {result}
            </p>
          )}
        </div>
      </div>

      {/* Adherence dashboard */}
      {adherence.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-4">Patient Adherence</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Patient</th>
                  <th className="pb-2 pr-4">Service</th>
                  <th className="pb-2 pr-4">Regimen</th>
                  <th className="pb-2 pr-4">Expected</th>
                  <th className="pb-2 pr-4">Completed</th>
                  <th className="pb-2 pr-4">No-shows</th>
                  <th className="pb-2 pr-4">Adherence</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {adherence.map(row => (
                  <tr key={row.order_id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.patient}</td>
                    <td className="py-2 pr-4">{row.service}</td>
                    <td className="py-2 pr-4 text-gray-500">{row.regimen}</td>
                    <td className="py-2 pr-4">{row.visits_expected}</td>
                    <td className="py-2 pr-4">{row.completed}</td>
                    <td className="py-2 pr-4">{row.no_shows > 0 ? <span className="text-red-600">{row.no_shows}</span> : 0}</td>
                    <td className="py-2 pr-4">{row.adherence_pct}%</td>
                    <td className="py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.risk === "FALLEN OFF" ? "bg-red-100 text-red-700" :
                        row.risk === "at risk" ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {row.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
