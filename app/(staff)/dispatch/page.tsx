"use client";

import { useState } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";

// Leaflet touches `window` at import time — must be client-only, or the
// Next.js server render crashes. This is the standard fix.
const DispatchMap = dynamic(() => import("@/components/dispatch-map"), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type AlertRow = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  warkari: { name: string; riskBadge: string } | null;
};

type Camp = { id: string; name: string; type: string; latitude: number; longitude: number };

type Suggestion = { responderId: string; name: string; distanceMeters: number; score: number; reason: string | null };

export default function DispatchPage() {
  const { data, mutate } = useSWR<{ alerts: AlertRow[] }>("/api/alerts?status=OPEN", fetcher, {
    refreshInterval: 7000,
  });
  const { data: campsData } = useSWR<{ camps: Camp[] }>("/api/camps", fetcher);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function getSuggestion(alertId: string) {
    setSelectedId(alertId);
    setLoadingSuggestion(true);
    setSuggestions([]);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/dispatch/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Could not get suggestions.");
      } else {
        setSuggestions(json.suggestions ?? []);
      }
    } finally {
      setLoadingSuggestion(false);
    }
  }

  async function confirmAssign(responderId: string) {
    if (!selectedId) return;
    await fetch(`/api/alerts/${selectedId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responderId }),
    });
    setSelectedId(null);
    setSuggestions([]);
    mutate();
  }

  const alerts = data?.alerts ?? [];
  const camps = campsData?.camps ?? [];

  return (
    <main className="min-h-screen flex">
      <section className="flex-1 p-6">
        <h1 className="font-display text-xl font-bold mb-4">VariSaarathi — Dispatch</h1>
        <DispatchMap camps={camps} alerts={alerts} />
      </section>

      <aside className="w-96 border-l p-4 flex flex-col gap-3 overflow-y-auto">
        <h2 className="font-body font-semibold text-sm uppercase tracking-wide text-text-primary/60">
          Alert Queue ({alerts.length})
        </h2>

        {alerts.length === 0 && <p className="text-sm text-text-primary/40">No open alerts.</p>}

        {alerts.map((a) => (
          <button
            key={a.id}
            onClick={() => getSuggestion(a.id)}
            className={`text-left rounded-lg p-3 border ${
              selectedId === a.id ? "border-accent-saffron" : "border-black/10"
            } bg-surface-raised`}
          >
            <div className="flex items-center justify-between">
              <span className="font-body font-medium">{a.type}</span>
              {!a.latitude && <span className="text-xs text-risk-amber">no location</span>}
            </div>
            <p className="text-xs text-text-primary/50 font-mono mt-1">
              #{a.id.slice(0, 8)} · {new Date(a.createdAt).toLocaleTimeString()}
            </p>
          </button>
        ))}

        {selectedId && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-body font-semibold text-sm mb-2">Suggested Responders</h3>
            {loadingSuggestion && <p className="text-sm text-text-primary/50">Scoring candidates…</p>}
            {errorMsg && <p className="text-sm text-sos-red">{errorMsg}</p>}
            {suggestions.map((s) => (
              <div key={s.responderId} className="rounded-lg bg-surface-raised p-3 mb-2 border border-black/10">
                <div className="flex items-center justify-between">
                  <span className="font-body font-medium">{s.name}</span>
                  <span className="text-xs font-mono text-text-primary/50">{s.distanceMeters}m</span>
                </div>
                {s.reason && <p className="text-xs text-text-primary/60 mt-1">{s.reason}</p>}
                <button
                  onClick={() => confirmAssign(s.responderId)}
                  className="mt-2 w-full py-1.5 rounded-md bg-accent-saffron text-white text-sm font-semibold"
                >
                  Confirm Assignment
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>
    </main>
  );
}