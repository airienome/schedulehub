"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CenterMap } from "./map";

type Center = {
  id: string; name: string; phone: string; email: string;
  address_line1: string; city: string; state: string; zip: string;
  offers_home_visits: boolean; home_visit_radius_km: number;
  scheduling_mode: string; ehr_system: string;
  onboarded: boolean; rating: number;
  services: string[] | null; service_codes: string[] | null;
  in_network_payers: string[] | null;
  next_available: string | null; open_spots: number;
  lat: number; lng: number;
};

const SPECIALTY_COLORS: Record<string, string> = {
  PT_ORTHO: "bg-sky/30 text-warm-800",
  PT_NEURO: "bg-lavender/15 text-lavender",
  PT_AQUATIC: "bg-sky/40 text-warm-800",
  OT: "bg-peach/30 text-warm-800",
  PT_HOME: "bg-olive/20 text-olive-dark",
};

const FILTERS = ["Orthopedic", "Neuro", "Aquatic", "Home Visits", "Onboarded"];

export default function CentersPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);

  const handleMapSelect = useCallback((id: string) => {
    setSelectedCenterId(id);
    document.getElementById(`center-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    fetch("/api/centers").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCenters(d);
      setLoading(false);
    });
  }, []);

  function toggleFilter(f: string) {
    setActiveFilters(prev => ({ ...prev, [f]: !prev[f] }));
  }

  const filtered = centers.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.city.toLowerCase().includes(q) &&
          !(c.services || []).some(s => s.toLowerCase().includes(q))) return false;
    }
    if (activeFilters["Orthopedic"] && !(c.service_codes || []).includes("PT_ORTHO")) return false;
    if (activeFilters["Neuro"] && !(c.service_codes || []).includes("PT_NEURO")) return false;
    if (activeFilters["Aquatic"] && !(c.service_codes || []).includes("PT_AQUATIC")) return false;
    if (activeFilters["Home Visits"] && !c.offers_home_visits) return false;
    if (activeFilters["Onboarded"] && !c.onboarded) return false;
    return true;
  });

  function fmtNextAvail(d: string | null) {
    if (!d) return "No slots";
    const dt = new Date(d);
    const now = new Date();
    const diffH = (dt.getTime() - now.getTime()) / 3600000;
    if (diffH < 6) return "Today " + dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return dt.toLocaleDateString(undefined, { weekday: "short" }) + " " + dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col min-h-full">
      <nav className="border-b border-warm-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="TherapyFlow" className="h-8" />
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold text-warm-600">
            <Link href="/doctor" className="hover:text-warm-900">Doctor</Link>
            <Link href="/admin" className="hover:text-warm-900">Admin</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Find a physical therapist</h1>
          <p className="text-sm text-warm-500 mt-1 max-w-lg">
            Search by condition or location, filter by what matters, and see the next open slot.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-lg">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search condition, clinic name, or city..."
            className="w-full border border-warm-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent" />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => toggleFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeFilters[f]
                  ? "bg-pink text-white border-pink"
                  : "bg-white text-warm-600 border-warm-300 hover:border-warm-400"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-warm-400">Loading clinics...</div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Clinic list */}
            <div className="lg:col-span-3 space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-warm-400 text-sm">No clinics match your search.</div>
              ) : filtered.map(c => (
                <div key={c.id} id={`center-${c.id}`} onClick={() => setSelectedCenterId(c.id)}
                  className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 cursor-pointer transition-all ${selectedCenterId === c.id ? "border-pink ring-2 ring-pink/20" : "border-warm-200 hover:border-warm-300"}`}>
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-warm-900">{c.name}</h3>
                    <span className="text-sm text-warm-500">&#9733; {c.rating}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-1.5 flex-wrap">
                    {(c.service_codes || []).map(code => (
                      <span key={code} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SPECIALTY_COLORS[code] || "bg-warm-100 text-warm-500"}`}>
                        {code === "PT_ORTHO" ? "Ortho" : code === "PT_NEURO" ? "Neuro" : code === "PT_AQUATIC" ? "Aquatic" : code === "OT" ? "OT" : code === "PT_HOME" ? "Home" : code}
                      </span>
                    ))}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-warm-100 text-warm-500">
                      {c.city}
                    </span>
                    {c.offers_home_visits && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-olive/20 text-olive-dark">
                        Home visits{c.home_visit_radius_km ? ` (${c.home_visit_radius_km}km)` : ""}
                      </span>
                    )}
                  </div>

                  {/* Next available + spots + action */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-warm-400">Next available</div>
                      <div className="font-bold text-sm text-warm-800">{fmtNextAvail(c.next_available)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="w-11 h-11 rounded-full border-2 border-olive flex items-center justify-center font-bold text-olive-dark text-sm">
                          {c.open_spots}
                        </div>
                        <div className="text-[10px] text-warm-400 mt-0.5">spots</div>
                      </div>
                      <a href={`https://maps.google.com/maps?q=${encodeURIComponent(`${c.address_line1}, ${c.city}, ${c.state} ${c.zip}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-4 py-2 bg-sky text-warm-800 rounded-xl text-sm font-semibold hover:bg-sky-dark transition-colors">
                        Directions &#8599;
                      </a>
                    </div>
                  </div>

                  {/* In-network payers */}
                  {c.in_network_payers && c.in_network_payers.length > 0 && (
                    <div className="flex gap-1 flex-wrap pt-1 border-t border-warm-100">
                      <span className="text-[10px] text-warm-400 mr-1 self-center">In-network:</span>
                      {c.in_network_payers.map(p => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-blush text-warm-600">{p}</span>
                      ))}
                    </div>
                  )}

                  {/* Contact row */}
                  <div className="flex items-center gap-4 text-xs text-warm-400">
                    <span>{c.phone}</span>
                    <span>{c.address_line1}</span>
                    {!c.onboarded && <span className="text-warm-300 italic">Not onboarded</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="lg:col-span-2 hidden lg:block">
              <div className="sticky top-6 h-[480px]">
                <CenterMap
                  centers={filtered.map(c => ({
                    id: c.id, name: c.name, lat: c.lat, lng: c.lng,
                    address: `${c.address_line1}, ${c.city}`,
                    rating: c.rating, open_spots: c.open_spots,
                  }))}
                  selectedId={selectedCenterId}
                  onSelect={handleMapSelect}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
