"use client";

import { useEffect, useRef, useState } from "react";

type MarkerData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating: number;
  open_spots: number;
};

declare global {
  interface Window {
    initGoogleMaps?: () => void;
  }
}

export function CenterMap({
  centers,
  selectedId,
  onSelect,
}: {
  centers: MarkerData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return;

    if (window.google?.maps) {
      setLoaded(true);
      return;
    }

    window.initGoogleMaps = () => setLoaded(true);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initGoogleMaps&libraries=marker&v=weekly`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete window.initGoogleMaps;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;

    // Center on Miami-Dade
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: { lat: 25.78, lng: -80.22 },
      zoom: 11,
      mapId: "therapyflow_centers",
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
  }, [loaded]);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !loaded) return;

    // Clear old markers
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];

    if (centers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    centers.forEach(c => {
      if (!c.lat || !c.lng) return;

      const pos = { lat: c.lat, lng: c.lng };
      bounds.extend(pos);

      const pin = document.createElement("div");
      pin.className = "map-pin";
      pin.style.cssText = `
        width: 32px; height: 32px; border-radius: 50%;
        background: ${c.id === selectedId ? "#EE0D63" : "#B2CFEE"};
        border: 2px solid ${c.id === selectedId ? "#c40a53" : "#8ab2df"};
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; color: ${c.id === selectedId ? "#fff" : "#2C1F28"};
        cursor: pointer; transition: all 0.2s;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      `;
      pin.textContent = String(c.open_spots);
      pin.title = c.name;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: pos,
        content: pin,
        title: c.name,
      });

      marker.addListener("click", () => onSelect(c.id));
      markersRef.current.push(marker);
    });

    if (centers.length > 1) {
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    } else if (centers.length === 1 && centers[0].lat) {
      map.setCenter({ lat: centers[0].lat, lng: centers[0].lng });
      map.setZoom(14);
    }
  }, [centers, selectedId, loaded, onSelect]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
    return (
      <div className="bg-warm-100 rounded-2xl border border-warm-200 h-full min-h-[320px] flex items-center justify-center text-warm-400 text-sm">
        <div className="text-center space-y-2">
          <div className="text-3xl">&#128506;</div>
          <p>Map requires GOOGLE_MAPS_KEY</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="rounded-2xl border border-warm-200 overflow-hidden h-full min-h-[320px]" />
  );
}
