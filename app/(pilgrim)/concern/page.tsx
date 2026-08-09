"use client";

import { useState } from "react";

type Category = "OVERCHARGED_FACILITY" | "SANITATION" | "WATER_FOOD_QUALITY" | "OTHER";

const CATEGORY_LABELS: Record<Category, string> = {
  OVERCHARGED_FACILITY: "Overcharged for free facility",
  SANITATION: "Sanitation issue",
  WATER_FOOD_QUALITY: "Water / food quality",
  OTHER: "Other",
};

export default function ConcernPage() {
  const [category, setCategory] = useState<Category>("SANITATION");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { timeout: 10000 }
        );
      });

      if (!position) {
        setError("Location is required to submit a concern. Please allow location access and try again.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: description || undefined,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      if (!res.ok) throw new Error("Could not submit. Please try again.");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3 bg-surface-base">
        <div className="w-16 h-16 rounded-full bg-accent-indigo/10 flex items-center justify-center mb-2">
          <div className="w-8 h-8 rounded-full bg-accent-indigo" />
        </div>
        <h1 className="font-display text-2xl font-bold">Logged for review</h1>
        <p className="font-body text-text-primary/70 max-w-sm">
          This is a queue, not an emergency dispatch — someone will review it. For urgent help, use SOS instead.
        </p>
        <a href="/sos" className="font-body text-accent-indigo underline text-sm mt-2">
          Back to SOS
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-surface-base">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-accent-indigo">Raise a Concern</h1>
          <p className="font-body text-sm text-text-primary/60 mt-1">Non-emergency. For urgent help, use SOS instead.</p>
        </div>

        {error && <p className="text-sos-red text-sm text-center font-body">{error}</p>}

        <div className="flex flex-col gap-2">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <label
              key={c}
              className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors font-body text-sm ${
                category === c ? "border-accent-indigo bg-accent-indigo/5" : "border-black/10 bg-surface-raised"
              }`}
            >
              <input type="radio" name="category" checked={category === c} onChange={() => setCategory(c)} className="accent-accent-indigo" />
              {CATEGORY_LABELS[c]}
            </label>
          ))}
        </div>

        <textarea
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-black/10 rounded-xl px-4 py-3 min-h-24 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent-indigo/30"
        />

        <button
          disabled={submitting}
          type="submit"
          className="bg-accent-indigo text-white rounded-xl py-3 font-body font-semibold disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>

        <a href="/sos" className="text-center font-body text-xs text-text-primary/50 underline">
          Back to SOS
        </a>
      </form>
    </main>
  );
}