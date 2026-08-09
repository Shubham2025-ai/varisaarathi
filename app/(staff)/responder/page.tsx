"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type AlertRow = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  warkari: { name: string; riskBadge: string; bloodGroup: string | null } | null;
};

export default function ResponderPage() {
  const { data, mutate } = useSWR<{ alerts: AlertRow[] }>("/api/alerts", fetcher, {
    refreshInterval: 7000,
  });

  const myCases = (data?.alerts ?? []).filter(
    (a) => a.status === "RESPONDER_ASSIGNED" || a.status === "EN_ROUTE"
  );

  async function updateStatus(alertId: string, status: "EN_ROUTE" | "RESOLVED") {
    await fetch(`/api/alerts/${alertId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  }

  if (myCases.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-night-surface-base text-night-text-primary">
        <p className="font-body text-night-text-primary/40">No active assignment.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 flex flex-col gap-4 max-w-md mx-auto bg-night-surface-base text-night-text-primary">
      <h1 className="font-display text-xl font-bold text-night-accent-saffron">Assigned Cases</h1>

      {myCases.map((a) => (
        <div key={a.id} className="rounded-xl border border-white/10 bg-night-surface-raised p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-body font-semibold">{a.type}</span>
            <span className="text-xs font-mono text-night-text-primary/40 uppercase">{a.status.replace("_", " ")}</span>
          </div>

          {a.warkari && (
            <p className="font-body text-sm text-night-text-primary/70">
              {a.warkari.name} · Blood group: {a.warkari.bloodGroup ?? "unknown"} · Risk: {a.warkari.riskBadge}
            </p>
          )}

          {a.latitude && a.longitude && (
            <a
              href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="font-body text-sm text-night-accent-saffron underline"
            >
              Open in Maps
            </a>
          )}

          <div className="flex gap-2 mt-2">
            {a.status === "RESPONDER_ASSIGNED" && (
              <button
                onClick={() => updateStatus(a.id, "EN_ROUTE")}
                className="flex-1 py-2 rounded-lg bg-night-accent-saffron text-night-surface-base font-body font-semibold text-sm"
              >
                En Route
              </button>
            )}
            {a.status === "EN_ROUTE" && (
              <button
                onClick={() => updateStatus(a.id, "RESOLVED")}
                className="flex-1 py-2 rounded-lg bg-risk-green text-white font-body font-semibold text-sm"
              >
                Resolved
              </button>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}