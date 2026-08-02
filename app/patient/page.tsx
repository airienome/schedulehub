"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { verifyPatientToken } from "@/lib/patient-token";
import { PatientTimeline } from "./timeline";

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

export default async function PatientPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t: token } = await searchParams;

  if (!token) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-sm">
          <div className="text-4xl">🔒</div>
          <h1 className="text-xl font-semibold">Patient Portal</h1>
          <p className="text-sm text-gray-500">
            This page is only accessible via a link sent to your phone.
            No login required &mdash; just tap the link in your message.
          </p>
        </div>
      </main>
    );
  }

  const patientId = verifyPatientToken(token);

  if (!patientId) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-sm">
          <div className="text-4xl">&#9203;</div>
          <h1 className="text-xl font-semibold">Link Expired</h1>
          <p className="text-sm text-gray-500">
            This link has expired or is invalid.
            Check your messages for a newer link, or call your care coordinator.
          </p>
        </div>
      </main>
    );
  }

  return <PatientTimeline patientId={patientId} />;
}
