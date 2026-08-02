"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = {
  id: string; status: string; urgency: string; created_at: string;
  patient_first: string; patient_last: string; patient_phone: string;
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
  received: "bg-gray-100 text-gray-700",
  contacting_patient: "bg-blue-100 text-blue-700",
  matching: "bg-purple-100 text-purple-700",
  scheduled: "bg-cyan-100 text-cyan-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [outreach, setOutreach] = useState<OutreachMsg[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "outreach">("orders");
  const [loading, setLoading] = useState(true);

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
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr; Home</Link>
          <h1 className="text-2xl font-bold mt-1">Coordinator Dashboard</h1>
          <p className="text-sm text-gray-500">All orders and outreach activity across practices</p>
        </div>
        <button onClick={refresh}
          className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "orders" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          Orders ({orders.length})
        </button>
        <button onClick={() => setActiveTab("outreach")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "outreach" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          Outreach Log ({outreach.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : activeTab === "orders" ? (
        <div className="space-y-6">
          {statusOrder.filter(s => grouped[s]).map(status => (
            <div key={status}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100"}`}>
                  {status.replace(/_/g, " ")}
                </span>
                <span className="text-gray-400">{grouped[status].length}</span>
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y">
                {grouped[status].map(order => (
                  <div key={order.id} className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.patient_first} {order.patient_last}</span>
                        <span className="text-gray-400 text-xs">{order.patient_phone}</span>
                        {order.urgency !== "routine" && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                            {order.urgency}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.service_name} &middot; Dr. {order.provider_last}
                        {order.practice_name && <> &middot; {order.practice_name}</>}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.frequency_per_week}x/wk for {order.duration_weeks}wk
                        {order.clinical_notes && <> &middot; {order.clinical_notes.substring(0, 60)}</>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wide">
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
                  <tr key={msg.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(msg.sent_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">
                      {msg.patient_first} {msg.patient_last}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        msg.channel === "voice" ? "bg-purple-100 text-purple-700" :
                        msg.channel === "sms" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100"
                      }`}>
                        {msg.channel}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {msg.direction === "outbound" ? "Out" : "In"}
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {msg.purpose.replace(/_/g, " ")}
                    </td>
                    <td className="p-3 text-xs text-gray-600 max-w-xs truncate">
                      {msg.body?.substring(0, 80)}
                    </td>
                    <td className="p-3">
                      {msg.responded ? (
                        <span className="text-green-600 text-xs">Yes</span>
                      ) : msg.direction === "outbound" ? (
                        <span className="text-gray-400 text-xs">Waiting</span>
                      ) : null}
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
