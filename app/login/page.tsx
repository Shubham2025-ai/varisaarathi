"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const ROLE_REDIRECTS: Record<string, string> = {
  DISPATCHER: "/dispatch",
  RESPONDER: "/responder",
  ADMIN: "/admin",
  VOLUNTEER: "/scan",
  DOCTOR: "/scan",
};

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { phone, password, redirect: false });

    if (res?.error) {
      setError("Invalid phone or password.");
      setLoading(false);
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role as string | undefined;

    router.push(role && ROLE_REDIRECTS[role] ? ROLE_REDIRECTS[role] : "/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-surface-base">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4 bg-surface-raised border border-black/10 rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-1">
          <h1 className="font-display text-2xl font-bold text-accent-saffron">Staff Login</h1>
          <p className="font-body text-xs text-text-primary/50 mt-1">VariSaarathi staff portal</p>
        </div>

        {error && <p className="text-sos-red text-sm text-center font-body">{error}</p>}

        <input
          type="text"
          placeholder="Phone (e.g. +919000000001)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-black/10 rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent-saffron/40"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-black/10 rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent-saffron/40"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent-saffron text-white rounded-lg py-2.5 font-body font-semibold disabled:opacity-60 transition-opacity"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="font-mono text-[10px] leading-relaxed text-center text-text-primary/40 mt-2">
          Demo: +919000000001 (Dispatcher) · +919000000002 (Responder)<br />
          +919000000004 (Admin) · +919000000005 (Volunteer) — pw: demo1234
        </p>
      </form>
    </main>
  );
}