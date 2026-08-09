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
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-text-primary/50 font-body">No active assignment.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 flex flex-col gap-4 max-w-md mx-auto">
      <h1 className="font-display text-xl font-bold">Assigned Cases</h1>

      {myCases.map((a) => (
        <div key={a.id} className="rounded-xl border border-black/10 bg-surface-raised p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-body font-semibold">{a.type}</span>
            <span className="text-xs font-mono text-text-primary/50">{a.status}</span>
          </div>

          {a.warkari && (
            <p className="text-sm text-text-primary/70">
              {a.warkari.name} · Blood group: {a.warkari.bloodGroup ?? "unknown"} · Risk: {a.warkari.riskBadge}
            </p>
          )}

          {a.latitude && a.longitude && (
            <a
              href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-accent-indigo underline"
            >
              Open in Maps
            </a>
          )}

          <div className="flex gap-2 mt-2">
            {a.status === "RESPONDER_ASSIGNED" && (
              <button
                onClick={() => updateStatus(a.id, "EN_ROUTE")}
                className="flex-1 py-2 rounded-lg bg-accent-saffron text-white font-semibold text-sm"
              >
                En Route
              </button>
            )}
            {a.status === "EN_ROUTE" && (
              <button
                onClick={() => updateStatus(a.id, "RESOLVED")}
                className="flex-1 py-2 rounded-lg bg-risk-green text-white font-semibold text-sm"
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