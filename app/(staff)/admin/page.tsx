"use client";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Concern = {
  id: string;
  category: string;
  description: string | null;
  status: "QUEUED" | "IN_REVIEW" | "RESOLVED";
  latitude: number;
  longitude: number;
  createdAt: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  OVERCHARGED_FACILITY: "Overcharged for free facility",
  SANITATION: "Sanitation issue",
  WATER_FOOD_QUALITY: "Water / food quality",
  OTHER: "Other",
};

const STATUS_COLOR: Record<string, string> = {
  QUEUED: "#E8A93A",
  IN_REVIEW: "#6E4FA3",
  RESOLVED: "#3C8248",
};

export default function AdminPage() {
  const [filter, setFilter] = useState<string>("");
  const { data, mutate } = useSWR<{ concerns: Concern[] }>(
    `/api/concerns${filter ? `?status=${filter}` : ""}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  async function updateStatus(id: string, status: "IN_REVIEW" | "RESOLVED") {
    await fetch(`/api/concerns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  }

  const concerns = data?.concerns ?? [];

  return (
    <main className="min-h-screen px-6 py-8 max-w-3xl mx-auto bg-night-surface-base text-night-text-primary">
      <h1 className="font-display text-2xl font-bold text-night-accent-saffron mb-1">Admin</h1>
      <p className="font-body text-xs text-night-text-primary/40 mb-5">Concerns queue</p>

      <div className="flex gap-2 mb-5">
        {["", "QUEUED", "IN_REVIEW", "RESOLVED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${
              filter === s
                ? "bg-night-accent-saffron text-night-surface-base border-night-accent-saffron font-semibold"
                : "border-white/15 text-night-text-primary/60"
            }`}
          >
            {s ? s.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      {concerns.length === 0 && <p className="font-body text-night-text-primary/40 text-sm">No concerns match this filter.</p>}

      <div className="flex flex-col gap-3">
        {concerns.map((c) => (
          <div key={c.id} className="rounded-xl border border-white/10 bg-night-surface-raised p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-body font-semibold">{CATEGORY_LABELS[c.category] ?? c.category}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full text-white font-body font-medium uppercase tracking-wide"
                style={{ backgroundColor: STATUS_COLOR[c.status] }}
              >
                {c.status.replace("_", " ")}
              </span>
            </div>
            {c.description && <p className="font-body text-sm text-night-text-primary/70 mb-2">{c.description}</p>}
            <p className="font-mono text-xs text-night-text-primary/30 mb-3">
              #{c.id.slice(0, 8)} · {new Date(c.createdAt).toLocaleString()} ·{" "}
              <a
                href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="underline text-night-accent-saffron"
              >
                View location
              </a>
            </p>
            <div className="flex gap-2">
              {c.status !== "IN_REVIEW" && c.status !== "RESOLVED" && (
                <button
                  onClick={() => updateStatus(c.id, "IN_REVIEW")}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-night-text-primary/80 font-body font-semibold"
                >
                  Mark In Review
                </button>
              )}
              {c.status !== "RESOLVED" && (
                <button
                  onClick={() => updateStatus(c.id, "RESOLVED")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-risk-green text-white font-body font-semibold"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}