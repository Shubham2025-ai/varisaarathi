"use client";

import { useState } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";

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

const TYPE_COLOR: Record<string, string> = {
  MEDICAL: "#C81E3A",
  HEAT_RISK: "#E8A93A",
  SAFETY: "#6E4FA3",
  LOST_ELDERLY: "#6E4FA3",
  THEFT: "#6E4FA3",
};

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
    <main className="min-h-screen flex bg-night-surface-base text-night-text-primary">
      <section className="flex-1 p-6 flex flex-col gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-night-accent-saffron">VariSaarathi — Dispatch</h1>
          <p className="font-mono text-xs text-night-text-primary/40 mt-1">Control room · live feed</p>
        </div>
        <div className="rounded-xl overflow-hidden border border-white/10">
          <DispatchMap camps={camps} alerts={alerts} />
        </div>
      </section>

      <aside className="w-96 border-l border-white/10 p-4 flex flex-col gap-3 overflow-y-auto">
        <h2 className="font-body font-semibold text-xs uppercase tracking-wider text-night-text-primary/50">
          Alert Queue · {alerts.length}
        </h2>

        {alerts.length === 0 && <p className="font-body text-sm text-night-text-primary/40">No open alerts.</p>}

        {alerts.map((a) => (
          <button
            key={a.id}
            onClick={() => getSuggestion(a.id)}
            className={`text-left rounded-lg p-3 border transition-colors ${
              selectedId === a.id ? "border-night-accent-saffron bg-night-surface-raised" : "border-white/10 bg-night-surface-raised/60 hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-body font-medium text-sm">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLOR[a.type] ?? "#888" }} />
                {a.type}
              </span>
              {!a.latitude && <span className="text-[10px] font-mono text-risk-amber">no location</span>}
            </div>
            <p className="text-xs font-mono text-night-text-primary/40 mt-1.5">
              #{a.id.slice(0, 8)} · {new Date(a.createdAt).toLocaleTimeString()}
            </p>
          </button>
        ))}

        {selectedId && (
          <div className="mt-2 border-t border-white/10 pt-4">
            <h3 className="font-body font-semibold text-xs uppercase tracking-wider text-night-text-primary/50 mb-2">
              Suggested Responders
            </h3>
            {loadingSuggestion && <p className="font-body text-sm text-night-text-primary/50">Scoring candidates…</p>}
            {errorMsg && <p className="font-body text-sm text-risk-red">{errorMsg}</p>}
            {suggestions.map((s, i) => (
              <div
                key={s.responderId}
                className={`rounded-lg p-3 mb-2 border ${i === 0 ? "border-night-accent-saffron/50 bg-night-accent-saffron/5" : "border-white/10 bg-night-surface-raised"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-body font-medium text-sm">{s.name}</span>
                  <span className="text-xs font-mono text-night-text-primary/40">{s.distanceMeters}m</span>
                </div>
                {s.reason && <p className="text-xs font-body text-night-text-primary/60 mt-1 leading-snug">{s.reason}</p>}
                <button
                  onClick={() => confirmAssign(s.responderId)}
                  className="mt-2 w-full py-1.5 rounded-md bg-night-accent-saffron text-night-surface-base text-sm font-body font-semibold"
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