"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Center = {
  id: string; name: string; phone: string; email: string;
  address_line1: string; city: string; state: string; zip: string;
  offers_home_visits: boolean; home_visit_radius_km: number;
  scheduling_mode: string; ehr_system: string;
  onboarded: boolean; rating: number;
  services: string[] | null; in_network_payers: string[] | null;
};

export default function CentersPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/centers").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCenters(d);
      setLoading(false);
    });
  }, []);

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
          <span className="text-sm text-warm-500">PT Center Network</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6">
        <div>
          <Link href="/" className="text-sm text-warm-400 hover:text-warm-600">&larr; TherapyFlow 305</Link>
          <h1 className="text-2xl font-bold mt-1 text-warm-900">PT Centers</h1>
          <p className="text-sm text-warm-500">Physical therapy centers in our network. {centers.filter(c => c.onboarded).length} onboarded, {centers.filter(c => !c.onboarded).length} directory.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-warm-400">Loading...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {centers.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-warm-200 shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-warm-900">{c.name}</h3>
                    <p className="text-xs text-warm-500 mt-0.5">
                      {c.address_line1}, {c.city}, {c.state} {c.zip}
                    </p>
                  </div>
                  {c.rating && (
                    <span className="text-sm font-medium text-warm-700">
                      &#9733; {c.rating}
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {c.onboarded ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-olive/20 text-olive-dark font-medium">Onboarded</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-warm-100 text-warm-500">Directory</span>
                  )}
                  {c.offers_home_visits && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky/30 text-warm-800">
                      Home visits {c.home_visit_radius_km ? `(${c.home_visit_radius_km}km)` : ""}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-lavender/15 text-lavender">
                    {c.scheduling_mode}
                  </span>
                </div>

                {/* Services */}
                {c.services && c.services.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-warm-500 mb-1">Services</p>
                    <div className="flex gap-1 flex-wrap">
                      {c.services.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blush text-warm-700">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* In-network payers */}
                {c.in_network_payers && c.in_network_payers.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-warm-500 mb-1">In-Network</p>
                    <div className="flex gap-1 flex-wrap">
                      {c.in_network_payers.map(p => (
                        <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-peach/20 text-warm-700">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="flex items-center gap-3 pt-1 border-t border-warm-100 text-xs text-warm-500">
                  <span>{c.phone}</span>
                  {c.ehr_system && <span className="text-warm-400">{c.ehr_system}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
