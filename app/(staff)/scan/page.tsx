"use client";

import { useEffect, useRef, useState } from "react";
import { LanternBadge } from "@/components/lantern-badge";

type WarkariRecord = {
  id: string;
  name: string;
  gender: string;
  dob: string;
  bloodGroup: string | null;
  riskBadge: "GREEN" | "AMBER" | "RED";
  healthSummary: { hypertension: boolean; diabetes: boolean; asthma: boolean; other: string | null };
  dindi: { name: string };
};

export default function ScanPage() {
  const [record, setRecord] = useState<WarkariRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let isRunning = false;
    let html5QrCode: any = null;

    async function safeStop() {
      if (!isRunning || !html5QrCode) return;
      isRunning = false;
      try {
        await html5QrCode.stop();
      } catch {
        // Swallow — never let a stop() race crash the page.
      }
    }

    async function startScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      html5QrCode = new Html5Qrcode("qr-reader");

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText: string) => {
            if (cancelled) return;
            await safeStop();
            if (!cancelled) {
              setScanning(false);
              lookupWarkari(decodedText);
            }
          },
          () => {}
        );
        isRunning = true;
      } catch (e) {
        if (!cancelled) setError("Could not access camera. Check browser permissions.");
      }
    }

    if (scanning) startScanner();

    return () => {
      cancelled = true;
      safeStop();
    };
  }, [scanning]);

  async function lookupWarkari(qrCode: string) {
    setError(null);
    try {
      const res = await fetch(`/api/warkari/${qrCode}`);
      if (!res.ok) {
        setError("QR not recognized, or you don't have access to view this record.");
        return;
      }
      const json = await res.json();
      setRecord(json.warkari);
    } catch {
      setError("Network error looking up this QR. Please try again.");
    }
  }

  if (record) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 text-center bg-surface-base">
        <div className="mb-1">
          <LanternBadge level={record.riskBadge} showLabel size={22} />
        </div>
        <h1 className="font-display text-2xl font-bold">{record.name}</h1>
        <p className="font-body text-text-primary/70">
          {record.dindi.name} · {record.gender} · {new Date(record.dob).toLocaleDateString()}
        </p>
        <p className="font-body text-text-primary/70">Blood group: {record.bloodGroup ?? "unknown"}</p>
        <div className="flex gap-2 text-sm flex-wrap justify-center font-body">
          {record.healthSummary.hypertension && <span className="px-2.5 py-1 rounded-full bg-risk-red/10 text-risk-red font-medium">Hypertension</span>}
          {record.healthSummary.diabetes && <span className="px-2.5 py-1 rounded-full bg-risk-red/10 text-risk-red font-medium">Diabetes</span>}
          {record.healthSummary.asthma && <span className="px-2.5 py-1 rounded-full bg-risk-red/10 text-risk-red font-medium">Asthma</span>}
        </div>
        <button
          onClick={() => {
            setRecord(null);
            setScanning(true);
          }}
          className="mt-4 px-5 py-2.5 rounded-lg bg-accent-saffron text-white font-body font-semibold"
        >
          Scan Another
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-5 bg-surface-base">
      <div className="text-center">
        <h1 className="font-display text-xl font-bold text-accent-saffron">Scan Warkari QR</h1>
        <p className="font-body text-xs text-text-primary/50 mt-1">Point camera at the pilgrim's ID card</p>
      </div>
      {error && (
        <div className="text-center">
          <p className="text-sos-red text-sm mb-2 font-body">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setScanning(true);
            }}
            className="text-sm underline text-accent-indigo font-body"
          >
            Try again
          </button>
        </div>
      )}
      <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden border border-black/10" />
    </main>
  );
}