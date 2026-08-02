"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Patient = {
  id: string; first_name: string; last_name: string; dob: string;
  phone: string; preferred_language: string; preferred_channel: string;
  address_line1: string; city: string; state: string; zip: string;
  home_visit_ok: boolean; mobility_notes: string;
  payer_name: string; payer_type: string; plan_name: string;
  eligibility_status: string; pt_visit_limit: number; pt_visits_used: number;
  copay_cents: number; requires_auth: boolean;
};
type ServiceType = { id: string; code: string; name: string };
type AdherenceRow = {
  patient: string; service: string; ordering_md: string; regimen: string;
  visits_expected: number; completed: number; no_shows: number;
  adherence_pct: number; risk: string; order_id: string;
};
type OutreachMsg = {
  id: string; channel: string; direction: string; purpose: string;
  body: string; sent_at: string; responded: boolean;
  ai_extraction: Record<string, unknown> | null;
};
type PatientOrder = {
  id: string; status: string; frequency_per_week: number; duration_weeks: number;
  total_visits_ordered: number; urgency: string; clinical_notes: string;
  diagnosis_codes: string[]; created_at: string; service_name: string;
};
type PatientAppt = {
  id: string; order_id: string; visit_number: number; status: string;
  status_source: string; scheduled_start: string; is_home_visit: boolean;
  center_name: string; center_phone: string;
};

const PRACTICE_ID = "b0000000-0000-0000-0000-000000000001";
const PROVIDER_ID = "d0000000-0000-0000-0000-000000000001";

export default function DoctorPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [adherence, setAdherence] = useState<AdherenceRow[]>([]);
  const [tab, setTab] = useState<"patients" | "prescribe" | "adherence">("patients");

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [frequency, setFrequency] = useState(3);
  const [weeks, setWeeks] = useState(6);
  const [reeval, setReeval] = useState(14);
  const [urgency, setUrgency] = useState("routine");
  const [notes, setNotes] = useState("");
  const [diagCodes, setDiagCodes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: "", last_name: "", dob: "", phone: "",
    preferred_language: "en", address_line1: "", city: "Miami", state: "FL", zip: "",
  });
  const [addingPatient, setAddingPatient] = useState(false);

  useEffect(() => {
    fetch("/api/patients").then(r => r.json()).then(d => { if (Array.isArray(d)) setPatients(d); });
    fetch("/api/lookup?type=service_types").then(r => r.json()).then(d => { if (Array.isArray(d)) setServiceTypes(d); });
    fetch(`/api/adherence?practice_id=${PRACTICE_ID}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setAdherence(d); });
  }, []);

  async function addPatient() {
    setAddingPatient(true);
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPatient),
    });
    if (res.ok) {
      // Reload full roster to get insurance join data
      const updated = await fetch("/api/patients").then(r => r.json());
      if (Array.isArray(updated)) setPatients(updated);
      setShowAddPatient(false);
      setNewPatient({ first_name: "", last_name: "", dob: "", phone: "", preferred_language: "en", address_line1: "", city: "Miami", state: "FL", zip: "" });
    }
    setAddingPatient(false);
  }

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", dob: "", phone: "", preferred_language: "en", address_line1: "", city: "", state: "", zip: "", home_visit_ok: false });
  const [savingEdit, setSavingEdit] = useState(false);

  function startEdit(p: Patient) {
    setEditingPatient(p);
    setEditForm({
      first_name: p.first_name, last_name: p.last_name, dob: p.dob, phone: p.phone,
      preferred_language: p.preferred_language, address_line1: p.address_line1 || "",
      city: p.city || "", state: p.state || "", zip: p.zip || "", home_visit_ok: p.home_visit_ok,
    });
  }

  async function saveEdit() {
    if (!editingPatient) return;
    setSavingEdit(true);
    const res = await fetch("/api/patients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingPatient.id, ...editForm }),
    });
    if (res.ok) {
      const updated = await fetch("/api/patients").then(r => r.json());
      if (Array.isArray(updated)) setPatients(updated);
      setEditingPatient(null);
    }
    setSavingEdit(false);
  }

  // Patient detail panel state
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [detailOutreach, setDetailOutreach] = useState<OutreachMsg[]>([]);
  const [detailOrders, setDetailOrders] = useState<PatientOrder[]>([]);
  const [detailAppts, setDetailAppts] = useState<PatientAppt[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"activity" | "edit">("activity");

  async function openPatientDetail(p: Patient) {
    setDetailPatient(p);
    setDetailLoading(true);
    setDetailTab("activity");
    setEditForm({
      first_name: p.first_name, last_name: p.last_name, dob: p.dob, phone: p.phone,
      preferred_language: p.preferred_language, address_line1: p.address_line1 || "",
      city: p.city || "", state: p.state || "", zip: p.zip || "", home_visit_ok: p.home_visit_ok,
    });
    const res = await fetch(`/api/patient-detail?id=${p.id}`);
    const data = await res.json();
    setDetailOutreach(data.outreach || []);
    setDetailOrders(data.orders || []);
    setDetailAppts(data.appointments || []);
    setDetailLoading(false);
  }

  function selectAndPrescribe(p: Patient) {
    setDetailPatient(null);
    setSelectedPatient(p);
    setTab("prescribe");
    setResult(null);
  }

  async function submitOrder() {
    if (!selectedPatient) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: PROVIDER_ID,
          practice_id: PRACTICE_ID,
          patient_id: selectedPatient.id,
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
        setResult("Prescription sent. Patient will be texted shortly.");
        fetch(`/api/adherence?practice_id=${PRACTICE_ID}`).then(r => r.json()).then(setAdherence);
      } else {
        setResult(`Error: ${await res.text()}`);
      }
    } catch (e) {
      setResult(`Error: ${e}`);
    }
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Nav */}
      <nav className="border-b border-warm-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-warm-700">Therapy</span>
            <svg width="18" height="16" viewBox="0 0 24 22" fill="none">
              <defs><linearGradient id="hg" x1="0" y1="0" x2="24" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#ab65ba" /><stop offset="0.5" stopColor="#b2cfee" /><stop offset="1" stopColor="#ee0d63" />
              </linearGradient></defs>
              <path d="M12 21C12 21 1 14.1 1 7.3C1 3.8 3.7 1.5 6.8 1.5C9 1.5 10.9 2.8 12 4.8C13.1 2.8 15 1.5 17.2 1.5C20.3 1.5 23 3.8 23 7.3C23 14.1 12 21 12 21Z" fill="url(#hg)" />
            </svg>
            <span className="text-xl font-bold text-pink">Flow</span>
          </Link>
          <span className="text-sm text-warm-500">Dr. Maria Fernandez &middot; Gables Orthopedic Group</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-warm-100 rounded-xl p-1 w-fit">
          {(["patients", "prescribe", "adherence"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-white shadow-sm text-warm-900" : "text-warm-500 hover:text-warm-700"
              }`}>
              {t === "patients" ? `My Patients (${patients.length})` :
               t === "prescribe" ? "New Prescription" :
               `Adherence (${adherence.length})`}
            </button>
          ))}
        </div>

        {/* Patients roster */}
        {tab === "patients" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAddPatient(!showAddPatient)}
                className="px-4 py-2 bg-pink text-white rounded-xl text-sm font-semibold hover:bg-pink-dark transition-colors">
                + Add Patient
              </button>
            </div>

            {showAddPatient && (
              <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-warm-900">New Patient</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <input placeholder="First name" value={newPatient.first_name}
                    onChange={e => setNewPatient({ ...newPatient, first_name: e.target.value })}
                    className="border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  <input placeholder="Last name" value={newPatient.last_name}
                    onChange={e => setNewPatient({ ...newPatient, last_name: e.target.value })}
                    className="border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  <input type="date" placeholder="DOB" value={newPatient.dob}
                    onChange={e => setNewPatient({ ...newPatient, dob: e.target.value })}
                    className="border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  <input placeholder="Phone (305-555-1234)" value={newPatient.phone}
                    onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  <input placeholder="Address" value={newPatient.address_line1}
                    onChange={e => setNewPatient({ ...newPatient, address_line1: e.target.value })}
                    className="border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  <input placeholder="City" value={newPatient.city}
                    onChange={e => setNewPatient({ ...newPatient, city: e.target.value })}
                    className="border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  <input placeholder="State" value={newPatient.state}
                    onChange={e => setNewPatient({ ...newPatient, state: e.target.value })}
                    className="border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  <input placeholder="ZIP" value={newPatient.zip}
                    onChange={e => setNewPatient({ ...newPatient, zip: e.target.value })}
                    className="border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  <select value={newPatient.preferred_language}
                    onChange={e => setNewPatient({ ...newPatient, preferred_language: e.target.value })}
                    className="border border-warm-300 rounded-xl px-3 py-2 text-sm">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="ht">Haitian Creole</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={addPatient}
                    disabled={addingPatient || !newPatient.first_name || !newPatient.last_name || !newPatient.phone || !newPatient.dob}
                    className="px-5 py-2 bg-sky text-warm-800 rounded-xl text-sm font-semibold hover:bg-sky-dark disabled:opacity-50 transition-colors">
                    {addingPatient ? "Adding..." : "Add Patient"}
                  </button>
                  <button onClick={() => setShowAddPatient(false)}
                    className="px-5 py-2 border border-warm-300 rounded-xl text-sm text-warm-500 hover:bg-warm-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

          <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200 text-left text-warm-500 text-xs uppercase tracking-wide">
                    <th className="p-4">Patient</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Address</th>
                    <th className="p-4">Insurance</th>
                    <th className="p-4">Home/Mobile OK</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} className="border-b border-warm-100 last:border-0 hover:bg-blush/30 transition-colors cursor-pointer" onClick={() => openPatientDetail(p)}>
                      <td className="p-4">
                        <div className="font-medium text-warm-900 hover:text-pink">{p.first_name} {p.last_name}</div>
                        <div className="text-xs text-warm-400">
                          DOB: {p.dob} &middot; {p.preferred_language.toUpperCase()}
                        </div>
                      </td>
                      <td className="p-4 text-warm-600">{p.phone}</td>
                      <td className="p-4 text-warm-600 text-xs">
                        {p.address_line1 && <>{p.address_line1}<br />{p.city}, {p.state} {p.zip}</>}
                      </td>
                      <td className="p-4">
                        {p.payer_name ? (
                          <div>
                            <div className="text-warm-700 text-xs font-medium">{p.payer_name}</div>
                            <div className="text-warm-400 text-xs">{p.plan_name}</div>
                            <span className={`inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded-full ${
                              p.eligibility_status === "active" ? "bg-olive/20 text-olive-dark" :
                              p.eligibility_status === "unverified" ? "bg-peach/30 text-warm-700" :
                              "bg-warm-100 text-warm-500"
                            }`}>{p.eligibility_status || "unknown"}</span>
                          </div>
                        ) : <span className="text-warm-400 text-xs">None on file</span>}
                      </td>
                      <td className="p-4 text-center">
                        {p.home_visit_ok ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky/30 text-warm-800">Yes</span>
                        ) : (
                          <span className="text-xs text-warm-400">No</span>
                        )}
                      </td>
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <button onClick={() => selectAndPrescribe(p)}
                          className="px-3 py-1.5 bg-sky text-warm-800 rounded-lg text-xs font-medium hover:bg-sky-dark transition-colors">
                          Prescribe PT
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          </div>
        )}

      {/* Patient detail panel */}
      {detailPatient && (
        <div className="fixed inset-0 bg-black/30 flex justify-end z-50" onClick={() => setDetailPatient(null)}>
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-warm-200 px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-lg text-warm-900">{detailPatient.first_name} {detailPatient.last_name}</h2>
                <p className="text-xs text-warm-500">{detailPatient.phone} &middot; {detailPatient.preferred_language.toUpperCase()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => selectAndPrescribe(detailPatient)}
                  className="px-3 py-1.5 bg-sky text-warm-800 rounded-lg text-xs font-semibold hover:bg-sky-dark">Prescribe PT</button>
                <button onClick={() => setDetailPatient(null)} className="text-warm-400 hover:text-warm-600 text-xl px-2">&times;</button>
              </div>
            </div>

            {/* Tabs: Activity / Edit */}
            <div className="flex gap-1 bg-warm-100 mx-5 mt-4 rounded-xl p-1">
              <button onClick={() => setDetailTab("activity")} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${detailTab === "activity" ? "bg-white shadow-sm text-warm-900" : "text-warm-500"}`}>Activity</button>
              <button onClick={() => setDetailTab("edit")} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${detailTab === "edit" ? "bg-white shadow-sm text-warm-900" : "text-warm-500"}`}>Edit Info</button>
            </div>

            {detailLoading ? (
              <div className="text-center py-12 text-warm-400">Loading...</div>
            ) : detailTab === "activity" ? (
              <div className="p-5 space-y-5">
                {/* Patient info summary */}
                <div className="bg-warm-50 rounded-xl p-3 text-xs text-warm-600 space-y-1">
                  <div>{detailPatient.address_line1}, {detailPatient.city}, {detailPatient.state} {detailPatient.zip}</div>
                  <div>{detailPatient.payer_name} - {detailPatient.plan_name} ({detailPatient.eligibility_status})</div>
                  {detailPatient.home_visit_ok && <div className="text-sky-dark font-medium">Home/mobile therapy eligible</div>}
                  {detailPatient.mobility_notes && <div className="italic">{detailPatient.mobility_notes}</div>}
                </div>

                {/* Orders/Prescriptions */}
                {detailOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-warm-900 mb-2">Prescriptions</h3>
                    {detailOrders.map(o => (
                      <div key={o.id} className="border border-warm-200 rounded-xl p-3 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-warm-900">{o.service_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === "in_progress" ? "bg-olive/20 text-olive-dark" : o.status === "scheduled" ? "bg-sky/30 text-warm-800" : o.status === "contacting_patient" ? "bg-lavender/15 text-lavender" : "bg-warm-100 text-warm-500"}`}>{o.status.replace(/_/g, " ")}</span>
                        </div>
                        <div className="text-xs text-warm-500 mt-1">{o.frequency_per_week}x/wk for {o.duration_weeks}wk &middot; {o.total_visits_ordered} visits{o.urgency !== "routine" && <span className="text-pink ml-1">({o.urgency})</span>}</div>
                        {o.clinical_notes && <div className="text-xs text-warm-400 mt-1 italic">{o.clinical_notes}</div>}
                        {o.diagnosis_codes?.length > 0 && <div className="text-xs text-warm-400 mt-1">ICD: {o.diagnosis_codes.join(", ")}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Appointments */}
                {detailAppts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-warm-900 mb-2">Appointments</h3>
                    <div className="space-y-1.5">
                      {detailAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-warm-50">
                          <div>
                            <div className="text-sm text-warm-800">Visit #{a.visit_number} - {a.center_name}</div>
                            <div className="text-xs text-warm-500">
                              {new Date(a.scheduled_start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at {new Date(a.scheduled_start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                              {a.is_home_visit && " (Home)"}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            a.status === "completed" ? "bg-olive/20 text-olive-dark" :
                            a.status === "confirmed" ? "bg-sky/30 text-warm-800" :
                            a.status === "no_show" ? "bg-peach/30 text-pink" :
                            a.status === "scheduled" ? "bg-lavender/15 text-lavender" :
                            "bg-warm-100 text-warm-500"
                          }`}>{a.status.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outreach / communication log */}
                {detailOutreach.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-warm-900 mb-2">Communication Log</h3>
                    <div className="space-y-2">
                      {detailOutreach.map(msg => (
                        <div key={msg.id} className={`rounded-xl p-3 ${msg.direction === "inbound" ? "bg-sky/15 border border-sky/30 ml-4" : "bg-warm-50 border border-warm-200 mr-4"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${msg.channel === "voice" ? "bg-lavender/15 text-lavender" : "bg-sky/30 text-warm-700"}`}>{msg.channel === "voice" ? "Call" : "SMS"}</span>
                              <span className="text-[11px] font-medium text-warm-600">{msg.direction === "outbound" ? "Sent" : "Received"}</span>
                              {msg.direction === "outbound" && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${msg.responded ? "bg-olive/20 text-olive-dark" : "bg-warm-100 text-warm-400"}`}>{msg.responded ? "Replied" : "No reply"}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-warm-400 whitespace-nowrap">
                              {new Date(msg.sent_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} {new Date(msg.sent_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-warm-700 break-words whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                          {msg.ai_extraction && (
                            <details className="mt-1.5">
                              <summary className="text-[10px] text-warm-400 cursor-pointer">AI extraction</summary>
                              <pre className="text-[10px] text-warm-500 mt-1 whitespace-pre-wrap break-all">{JSON.stringify(msg.ai_extraction, null, 2)}</pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailOrders.length === 0 && detailOutreach.length === 0 && (
                  <div className="text-center py-8 text-warm-400 text-sm">No activity yet for this patient.</div>
                )}
              </div>
            ) : (
              /* Edit tab */
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">First name</label>
                    <input value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} className="w-full border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">Last name</label>
                    <input value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} className="w-full border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">DOB</label>
                    <input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} className="w-full border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">Phone</label>
                    <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-warm-500 mb-1">Address</label>
                    <input value={editForm.address_line1} onChange={e => setEditForm({ ...editForm, address_line1: e.target.value })} className="w-full border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <input placeholder="City" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <input placeholder="State" value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} className="w-20 border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                    <input placeholder="ZIP" value={editForm.zip} onChange={e => setEditForm({ ...editForm, zip: e.target.value })} className="flex-1 border border-warm-300 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">Language</label>
                    <select value={editForm.preferred_language} onChange={e => setEditForm({ ...editForm, preferred_language: e.target.value })} className="w-full border border-warm-300 rounded-xl px-3 py-2 text-sm">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="ht">Haitian Creole</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input type="checkbox" id="homeOk2" checked={editForm.home_visit_ok} onChange={e => setEditForm({ ...editForm, home_visit_ok: e.target.checked })} className="rounded" />
                    <label htmlFor="homeOk2" className="text-sm text-warm-700">Home/mobile therapy OK</label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={async () => {
                    if (!detailPatient) return;
                    setSavingEdit(true);
                    await fetch("/api/patients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: detailPatient.id, ...editForm }) });
                    const updated = await fetch("/api/patients").then(r => r.json());
                    if (Array.isArray(updated)) setPatients(updated);
                    setSavingEdit(false);
                    setDetailPatient(null);
                  }} disabled={savingEdit}
                    className="px-5 py-2 bg-sky text-warm-800 rounded-xl text-sm font-semibold hover:bg-sky-dark disabled:opacity-50 transition-colors">
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        {/* Prescription form */}
        {tab === "prescribe" && (
          <div className="max-w-2xl space-y-6">
            {selectedPatient ? (
              <>
                {/* Patient card */}
                <div className="bg-blush rounded-2xl border border-warm-200 p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-warm-900">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </div>
                    <div className="text-sm text-warm-500">
                      {selectedPatient.phone} &middot; {selectedPatient.address_line1}, {selectedPatient.city}
                    </div>
                    <div className="text-xs text-warm-400 mt-0.5">
                      {selectedPatient.payer_name} - {selectedPatient.plan_name}
                      {selectedPatient.home_visit_ok && " | Home visits OK"}
                    </div>
                  </div>
                  <button onClick={() => { setSelectedPatient(null); setTab("patients"); }}
                    className="text-xs text-warm-400 hover:text-warm-600">Change</button>
                </div>

                {/* Rx form */}
                <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-6 space-y-5">
                  <h2 className="font-semibold text-lg text-warm-900">PT Prescription</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-warm-700 mb-1">Service Type</label>
                      <select value={serviceTypeId} onChange={e => setServiceTypeId(e.target.value)}
                        className="w-full border border-warm-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-sky focus:border-transparent">
                        <option value="">Select...</option>
                        {serviceTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-warm-700 mb-1">Urgency</label>
                      <select value={urgency} onChange={e => setUrgency(e.target.value)}
                        className="w-full border border-warm-300 rounded-xl px-3 py-2.5 text-sm bg-white">
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="post_op">Post-Op</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-warm-700 mb-1">Frequency/week</label>
                      <input type="number" value={frequency} onChange={e => setFrequency(+e.target.value)}
                        min={1} max={7} className="w-full border border-warm-300 rounded-xl px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-warm-700 mb-1">Duration (weeks)</label>
                      <input type="number" value={weeks} onChange={e => setWeeks(+e.target.value)}
                        min={1} max={52} className="w-full border border-warm-300 rounded-xl px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-warm-700 mb-1">Re-eval (days)</label>
                      <input type="number" value={reeval} onChange={e => setReeval(+e.target.value)}
                        min={7} max={90} className="w-full border border-warm-300 rounded-xl px-3 py-2.5 text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">Diagnosis Codes</label>
                    <input value={diagCodes} onChange={e => setDiagCodes(e.target.value)}
                      placeholder="M75.101, S83.512D" className="w-full border border-warm-300 rounded-xl px-3 py-2.5 text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">Clinical Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      rows={2} className="w-full border border-warm-300 rounded-xl px-3 py-2.5 text-sm"
                      placeholder="Relevant clinical context..." />
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <button onClick={submitOrder}
                      disabled={submitting || !serviceTypeId}
                      className="px-6 py-2.5 bg-pink text-white rounded-xl font-semibold hover:bg-pink-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      {submitting ? "Sending..." : "Send Prescription"}
                    </button>
                    {result && (
                      <p className={`text-sm ${result.startsWith("Error") ? "text-pink" : "text-olive-dark"}`}>
                        {result}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-warm-400">
                    Submitting will text the patient to confirm they can take a call,
                    then our voice agent calls to schedule their appointments.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-warm-400">
                <p>Select a patient from the roster to write a prescription.</p>
                <button onClick={() => setTab("patients")}
                  className="mt-3 text-sm text-pink hover:text-pink-dark font-medium">
                  Go to Patient Roster
                </button>
              </div>
            )}
          </div>
        )}

        {/* Adherence */}
        {tab === "adherence" && (
          <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
            {adherence.length === 0 ? (
              <div className="text-center py-16 text-warm-400">
                No active prescriptions with appointments yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-warm-200 text-left text-warm-500 text-xs uppercase tracking-wide">
                      <th className="p-4">Patient</th>
                      <th className="p-4">Service</th>
                      <th className="p-4">Regimen</th>
                      <th className="p-4">Expected</th>
                      <th className="p-4">Completed</th>
                      <th className="p-4">No-shows</th>
                      <th className="p-4">Adherence</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adherence.map(row => (
                      <tr key={row.order_id} className="border-b border-warm-100 last:border-0">
                        <td className="p-4 font-medium text-warm-900">{row.patient}</td>
                        <td className="p-4 text-warm-600">{row.service}</td>
                        <td className="p-4 text-warm-500">{row.regimen}</td>
                        <td className="p-4">{row.visits_expected}</td>
                        <td className="p-4">{row.completed}</td>
                        <td className="p-4">{row.no_shows > 0 ? <span className="text-pink font-medium">{row.no_shows}</span> : 0}</td>
                        <td className="p-4 font-medium">{row.adherence_pct}%</td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            row.risk === "FALLEN OFF" ? "bg-peach/40 text-pink" :
                            row.risk === "at risk" ? "bg-peach/30 text-warm-700" :
                            "bg-olive/20 text-olive-dark"
                          }`}>
                            {row.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
