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

    // Fetch the session to read the role we just logged in as, then route accordingly.
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role as string | undefined;

    router.push(role && ROLE_REDIRECTS[role] ? ROLE_REDIRECTS[role] : "/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold text-center">Staff Login</h1>

        {error && <p className="text-sos-red text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Phone (e.g. +919000000001)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border rounded-lg px-4 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded-lg px-4 py-2"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent-saffron text-white rounded-lg py-2 font-semibold disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-center text-text-primary/50">
          Demo: +919000000001 (Dispatcher), +919000000002 (Responder),<br />
          +919000000004 (Admin), +919000000005 (Volunteer) — password: demo1234
        </p>
      </form>
    </main>
  );
}