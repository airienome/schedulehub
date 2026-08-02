"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = {
  id: string; status: string; urgency: string; created_at: string;
  patient_id: string; patient_first: string; patient_last: string; patient_phone: string;
  service_code: string; service_name: string;
  provider_first: string; provider_last: string;
  practice_name?: string;
  frequency_per_week: number; duration_weeks: number; clinical_notes: string;
};

type OutreachMsg = {
  id: string; patient_first: string; patient_last: string;
  channel: string; direction: string; purpose: string;
  body: string; sent_at: string; responded: boolean;
  ai_extraction: Record<string, unknown> | null;
};

const STATUS_COLORS: Record<string, string> = {
  received: "bg-warm-100 text-warm-700",
  contacting_patient: "bg-sky/30 text-warm-800",
  matching: "bg-lavender/15 text-lavender",
  scheduled: "bg-sky/30 text-warm-800",
  in_progress: "bg-olive/20 text-olive-dark",
  completed: "bg-olive/20 text-olive-dark",
  cancelled: "bg-peach/30 text-pink",
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [outreach, setOutreach] = useState<OutreachMsg[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "outreach" | "links">("orders");
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<{ url: string; patient: string; expires_in: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/outreach?limit=100").then(r => r.json()),
    ]).then(([o, m]) => {
      setOrders(o);
      setOutreach(m);
      setLoading(false);
    });
  }, []);

  function refresh() {
    setLoading(true);
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/outreach?limit=100").then(r => r.json()),
    ]).then(([o, m]) => {
      setOrders(o);
      setOutreach(m);
      setLoading(false);
    });
  }

  const grouped = orders.reduce<Record<string, Order[]>>((acc, o) => {
    (acc[o.status] = acc[o.status] || []).push(o);
    return acc;
  }, {});

  const statusOrder = ["received", "contacting_patient", "matching", "scheduled", "in_progress", "completed", "cancelled"];

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-warm-400 hover:text-warm-600">&larr; TherapyFlow 305</Link>
          <h1 className="text-2xl font-bold mt-1 text-warm-900">Coordinator Dashboard</h1>
          <p className="text-sm text-warm-500">All orders and outreach activity across practices</p>
        </div>
        <button onClick={refresh}
          className="px-4 py-2 bg-white border rounded-xl text-sm hover:bg-warm-50">
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "orders" ? "bg-white shadow-sm" : "text-warm-500 hover:text-warm-700"
          }`}>
          Orders ({orders.length})
        </button>
        <button onClick={() => setActiveTab("outreach")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "outreach" ? "bg-white shadow-sm" : "text-warm-500 hover:text-warm-700"
          }`}>
          Outreach Log ({outreach.length})
        </button>
        <button onClick={() => setActiveTab("links")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "links" ? "bg-white shadow-sm" : "text-warm-500 hover:text-warm-700"
          }`}>
          Patient Links
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-warm-400">Loading...</div>
      ) : activeTab === "orders" ? (
        <div className="space-y-6">
          {statusOrder.filter(s => grouped[s]).map(status => (
            <div key={status}>
              <h3 className="text-sm font-semibold text-warm-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-warm-100"}`}>
                  {status.replace(/_/g, " ")}
                </span>
                <span className="text-warm-400">{grouped[status].length}</span>
              </h3>
              <div className="bg-white rounded-xl border border-warm-200 shadow-sm divide-y">
                {grouped[status].map(order => (
                  <div key={order.id} className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.patient_first} {order.patient_last}</span>
                        <span className="text-warm-400 text-xs">{order.patient_phone}</span>
                        {order.urgency !== "routine" && (
                          <span className="text-xs px-1.5 py-0.5 bg-peach/30 text-pink rounded">
                            {order.urgency}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-warm-500">
                        {order.service_name} &middot; Dr. {order.provider_last}
                        {order.practice_name && <> &middot; {order.practice_name}</>}
                      </div>
                      <div className="text-xs text-warm-400">
                        {order.frequency_per_week}x/wk for {order.duration_weeks}wk
                        {order.clinical_notes && <> &middot; {order.clinical_notes.substring(0, 60)}</>}
                      </div>
                    </div>
                    <div className="text-xs text-warm-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "outreach" ? (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-warm-500 text-xs uppercase tracking-wide">
                  <th className="p-3">Time</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Direction</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Replied</th>
                </tr>
              </thead>
              <tbody>
                {outreach.map(msg => (
                  <tr key={msg.id} className="border-b last:border-0 hover:bg-warm-50">
                    <td className="p-3 text-xs text-warm-400 whitespace-nowrap">
                      {new Date(msg.sent_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">
                      {msg.patient_first} {msg.patient_last}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        msg.channel === "voice" ? "bg-lavender/15 text-lavender" :
                        msg.channel === "sms" ? "bg-sky/30 text-warm-800" :
                        "bg-warm-100"
                      }`}>
                        {msg.channel}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {msg.direction === "outbound" ? "Out" : "In"}
                    </td>
                    <td className="p-3 text-xs text-warm-500">
                      {msg.purpose.replace(/_/g, " ")}
                    </td>
                    <td className="p-3 text-xs text-warm-600 max-w-xs truncate">
                      {msg.body?.substring(0, 80)}
                    </td>
                    <td className="p-3">
                      {msg.responded ? (
                        <span className="text-olive-dark text-xs">Yes</span>
                      ) : msg.direction === "outbound" ? (
                        <span className="text-warm-400 text-xs">Waiting</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Patient Links tab */
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-lg">Generate Patient Link</h2>
          <p className="text-sm text-warm-500">
            Create a short-lived signed link for a patient to view their appointment status.
            This is what gets sent to their phone. No login, no account - just a tap.
          </p>

          <div className="flex flex-wrap gap-2">
            {/* Show unique patients from orders */}
            {Array.from(new Map(orders.map(o => [
              `${o.patient_first} ${o.patient_last}`,
              { name: `${o.patient_first} ${o.patient_last}`, phone: o.patient_phone, id: o.patient_id }
            ])).entries())
              .filter(([, v]) => v.id)
              .map(([name, info]) => (
              <button key={name} onClick={async () => {
                const res = await fetch("/api/patient-link", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ patient_id: info.id }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setGeneratedLink(data);
                }
              }}
                className="px-3 py-2 bg-warm-50 border rounded-xl text-sm hover:bg-warm-100 transition-colors">
                {name} <span className="text-warm-400 text-xs">{info.phone}</span>
              </button>
            ))}
          </div>

          {generatedLink && (
            <div className="mt-4 p-4 bg-peach/20 border border-amber-200 rounded-xl space-y-2">
              <p className="text-sm font-medium">Link for {generatedLink.patient}:</p>
              <div className="flex gap-2">
                <input readOnly value={generatedLink.url}
                  className="flex-1 text-xs bg-white border rounded px-2 py-1.5 font-mono" />
                <button onClick={() => navigator.clipboard.writeText(generatedLink.url)}
                  className="px-3 py-1.5 bg-pink text-white rounded text-xs hover:bg-pink-dark">
                  Copy
                </button>
                <a href={generatedLink.url} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-sky text-warm-800 rounded text-xs hover:bg-sky-dark">
                  Open
                </a>
              </div>
              <p className="text-xs text-pink">Expires in {generatedLink.expires_in}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
