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
  const scannerRef = useRef<any>(null);
  const [record, setRecord] = useState<WarkariRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let html5QrCode: any;

    async function startScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText: string) => {
            await html5QrCode.stop();
            setScanning(false);
            lookupWarkari(decodedText);
          },
          () => {} // ignore per-frame scan failures
        );
      } catch (e) {
        setError("Could not access camera. Check browser permissions.");
      }
    }

    if (scanning) startScanner();

    return () => {
      html5QrCode?.stop().catch(() => {});
    };
  }, [scanning]);

  async function lookupWarkari(qrCode: string) {
    setError(null);
    const res = await fetch(`/api/warkari/${qrCode}`);
    if (!res.ok) {
      setError("QR not recognized, or you don't have access to view this record.");
      return;
    }
    const json = await res.json();
    setRecord(json.warkari);
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
        <div className="flex gap-2 text-sm">
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
      {error && <p className="text-sos-red text-sm text-center">{error}</p>}
      <div id="qr-reader" className="w-full max-w-sm" />
    </main>
  );
}