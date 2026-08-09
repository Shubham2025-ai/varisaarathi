"use client";

import { useState } from "react";
import { IdCard } from "@/components/id-card";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dindiId: "",
    dindiName: "",
    dob: "",
    gender: "M",
    bloodGroup: "",
    address: "",
    aadhaarRaw: "",
    hypertension: false,
    diabetes: false,
    asthma: false,
  });
  const [result, setResult] = useState<{ warkariId: string; qrCode: string; riskBadge: "GREEN" | "AMBER" | "RED" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/warkari/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        dindiId: form.dindiId,
        dob: form.dob,
        gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        address: form.address,
        aadhaarRaw: form.aadhaarRaw,
        healthScreening: {
          hypertension: form.hypertension,
          diabetes: form.diabetes,
          asthma: form.asthma,
          other: null,
        },
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Registration failed.");
      return;
    }

    setResult(json);
  }

  const inputClass =
    "border border-black/10 rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent-saffron/40 bg-surface-raised";

  if (result) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-10 text-center bg-surface-base">
        <h1 className="font-display text-2xl font-bold print:hidden text-accent-saffron">Registered</h1>

        <IdCard
          name={form.name}
          dindiName={form.dindiName || "Dindi"}
          bloodGroup={form.bloodGroup || null}
          riskBadge={result.riskBadge}
          qrCode={result.qrCode}
        />

        <button
          onClick={() => {
            setResult(null);
            setForm({ ...form, name: "", phone: "", aadhaarRaw: "" });
          }}
          className="font-body text-accent-indigo underline text-sm print:hidden"
        >
          Register another
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10 bg-surface-base">
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold text-center mb-1 text-accent-saffron">Warkari Registration</h1>
        <p className="font-body text-xs text-text-primary/50 text-center mb-2">Staff-operated · pilgrim does not need to log in</p>

        {error && <p className="text-sos-red text-sm text-center font-body">{error}</p>}

        <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
        <input required placeholder="Dindi ID (from Prisma Studio)" value={form.dindiId} onChange={(e) => setForm({ ...form, dindiId: e.target.value })} className={inputClass} />
        <input placeholder="Dindi name (for the card, e.g. Demo Dindi)" value={form.dindiName} onChange={(e) => setForm({ ...form, dindiName: e.target.value })} className={inputClass} />
        <input required type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className={inputClass} />

        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass}>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="Other">Other</option>
        </select>

        <input placeholder="Blood group (optional)" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} className={inputClass} />
        <input required placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
        <input required placeholder="Aadhaar (verification only, not stored)" value={form.aadhaarRaw} onChange={(e) => setForm({ ...form, aadhaarRaw: e.target.value })} className={inputClass} />

        <div className="flex flex-col gap-1.5 text-sm font-body bg-surface-raised border border-black/10 rounded-lg p-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.hypertension} onChange={(e) => setForm({ ...form, hypertension: e.target.checked })} className="accent-accent-saffron" />
            Hypertension
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.diabetes} onChange={(e) => setForm({ ...form, diabetes: e.target.checked })} className="accent-accent-saffron" />
            Diabetes
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.asthma} onChange={(e) => setForm({ ...form, asthma: e.target.checked })} className="accent-accent-saffron" />
            Asthma
          </label>
        </div>

        <button disabled={loading} type="submit" className="bg-accent-saffron text-white rounded-lg py-2.5 font-body font-semibold disabled:opacity-60">
          {loading ? "Registering…" : "Register"}
        </button>
      </form>
    </main>
  );
}