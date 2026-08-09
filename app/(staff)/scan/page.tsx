"use client";

import { useEffect, useRef, useState } from "react";

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

const BADGE_COLOR: Record<string, string> = {
  GREEN: "#3C8248",
  AMBER: "#E8A93A",
  RED: "#C81E3A",
};

export default function ScanPage() {
  const [record, setRecord] = useState<WarkariRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Shared "is the scanner actually running" guard — checked/updated at
    // BOTH call sites (the success callback and the unmount cleanup) so
    // stop() is never called twice, regardless of which path gets there
    // first. This is the actual fix: the previous version only guarded
    // the callback, but the cleanup function could still call stop() a
    // second time via .catch() chaining, which doesn't catch a SYNCHRONOUS
    // throw from the library (only catches promise rejections) — hence
    // the "Uncaught" error surviving the first fix attempt.
    let isRunning = false;
    let html5QrCode: any = null;

    async function safeStop() {
      if (!isRunning || !html5QrCode) return;
      isRunning = false;
      try {
        await html5QrCode.stop();
      } catch {
        // Swallow — library sometimes throws even when we've correctly
        // guarded against a real double-stop; never let this crash the page.
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
          () => {} // ignore per-frame scan failures, expected while aiming
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
      <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: BADGE_COLOR[record.riskBadge] }}
        >
          {record.riskBadge}
        </div>
        <h1 className="font-display text-2xl font-bold">{record.name}</h1>
        <p className="text-text-primary/70">
          {record.dindi.name} · {record.gender} · {new Date(record.dob).toLocaleDateString()}
        </p>
        <p className="text-text-primary/70">Blood group: {record.bloodGroup ?? "unknown"}</p>
        <div className="flex gap-2 text-sm flex-wrap justify-center">
          {record.healthSummary.hypertension && <span className="px-2 py-1 rounded bg-risk-red/10 text-risk-red">Hypertension</span>}
          {record.healthSummary.diabetes && <span className="px-2 py-1 rounded bg-risk-red/10 text-risk-red">Diabetes</span>}
          {record.healthSummary.asthma && <span className="px-2 py-1 rounded bg-risk-red/10 text-risk-red">Asthma</span>}
        </div>
        <button
          onClick={() => {
            setRecord(null);
            setScanning(true);
          }}
          className="mt-4 px-4 py-2 rounded-lg bg-accent-saffron text-white font-semibold"
        >
          Scan Another
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-4">
      <h1 className="font-display text-xl font-bold">Scan Warkari QR</h1>
      {error && (
        <div className="text-center">
          <p className="text-sos-red text-sm mb-2">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setScanning(true);
            }}
            className="text-sm underline text-accent-indigo"
          >
            Try again
          </button>
        </div>
      )}
      <div id="qr-reader" className="w-full max-w-sm" />
    </main>
  );
}