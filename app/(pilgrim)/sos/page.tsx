"use client";

import { useState, useEffect } from "react";

type AlertType = "MEDICAL" | "HEAT_RISK" | "SAFETY" | "LOST_ELDERLY" | "THEFT";
type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESPONDER_ASSIGNED" | "EN_ROUTE" | "RESOLVED";
type Advisory = { routeSegment: string; heatIndex: number; textEn: string; textMr: string; pushedAt: string };

export default function SosPage() {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [status, setStatus] = useState<AlertStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/advisories")
      .then((r) => r.json())
      .then((data) => setAdvisory(data.advisory))
      .catch(() => {});
  }, []);

  async function sendAlert(type: AlertType = "MEDICAL") {
    setSending(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { timeout: 15000 }
        );
      });

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          triggerChannel: "APP",
          latitude: position?.coords.latitude ?? null,
          longitude: position?.coords.longitude ?? null,
        }),
      });

      if (!res.ok) throw new Error("Could not send alert. Please try again.");

      const data = await res.json();
      setAlertId(data.alertId);
      setStatus(data.status ?? "OPEN");
      setConfirming(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (alertId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4 bg-surface-base">
        <div className="w-24 h-24 rounded-full bg-risk-green/15 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-risk-green" />
        </div>
        <h1 className="font-display text-2xl font-bold">Help is on the way</h1>
        <p className="font-body text-text-primary/70">मदत येत आहे</p>
        <p className="font-mono text-sm text-text-primary/50">
          Alert #{alertId.slice(0, 8)} — {status}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col px-6 py-8 bg-surface-base">
      {advisory && !advisoryDismissed && (
        <div className="bg-accent-indigo/8 border border-accent-indigo/20 rounded-xl p-3.5 mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="font-body text-sm font-semibold text-accent-indigo">{advisory.routeSegment} — Heat Advisory</p>
            <p className="font-body text-sm text-text-primary/80 mt-0.5">{advisory.textEn}</p>
            <p className="font-body text-sm text-text-primary/60 mt-0.5">{advisory.textMr}</p>
          </div>
          <button onClick={() => setAdvisoryDismissed(true)} className="text-text-primary/40 text-lg leading-none shrink-0">
            ×
          </button>
        </div>
      )}

      <div className="flex-1" />

      {error && (
        <p className="text-sos-red text-sm text-center mb-4 font-body" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col items-center gap-6 pb-10">
        <button
          onClick={() => setConfirming(true)}
          className={`w-48 h-48 rounded-full bg-sos-red text-white font-display text-3xl font-bold shadow-lg active:scale-95 transition-transform ${
            confirming ? "" : "animate-beacon"
          }`}
          aria-label="Send emergency alert"
        >
          SOS
        </button>

        <a href="/concern" className="font-body text-sm text-text-primary/60 underline underline-offset-2">
          Raise a Concern (non-emergency)
        </a>
      </div>

      {confirming && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={() => !sending && setConfirming(false)}>
          <div
            className="w-full bg-surface-raised rounded-t-2xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold text-center">
              Send emergency alert?
              <br />
              <span className="text-base font-body font-normal text-text-primary/60">आणीबाणी सूचना पाठवायची?</span>
            </h2>
            <button
              disabled={sending}
              onClick={() => sendAlert("MEDICAL")}
              className="w-full py-4 rounded-xl bg-sos-red text-white font-body font-semibold disabled:opacity-60"
            >
              {sending ? "Sending…" : "Yes, send"}
            </button>
            <button
              disabled={sending}
              onClick={() => setConfirming(false)}
              className="w-full py-3 rounded-xl border border-black/10 font-body"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}