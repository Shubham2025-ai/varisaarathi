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
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <h1 className="font-display text-2xl font-bold">Logged for review</h1>
        <p className="text-text-primary/70 max-w-sm">
          This is a queue, not an emergency dispatch — someone will review it. For urgent help, use SOS instead.
        </p>
        <a href="/sos" className="text-accent-indigo underline text-sm mt-2">
          Back to SOS
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="font-display text-xl font-bold text-center">Raise a Concern</h1>
        <p className="text-sm text-text-primary/60 text-center">Non-emergency. For urgent help, use SOS instead.</p>

        {error && <p className="text-sos-red text-sm text-center">{error}</p>}

        <div className="flex flex-col gap-2">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <label key={c} className="flex items-center gap-2 border rounded-lg px-4 py-2 cursor-pointer">
              <input type="radio" name="category" checked={category === c} onChange={() => setCategory(c)} />
              {CATEGORY_LABELS[c]}
            </label>
          ))}
        </div>

        <textarea
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded-lg px-4 py-2 min-h-24"
        />

        <button
          disabled={submitting}
          type="submit"
          className="bg-accent-saffron text-white rounded-lg py-3 font-semibold disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>

        <a href="/sos" className="text-center text-xs text-text-primary/50 underline">
          Back to SOS
        </a>
      </form>
    </main>
  );
}