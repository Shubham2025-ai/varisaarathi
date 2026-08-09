import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6 py-16 bg-surface-base">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-accent-saffron tracking-tight">VariSaarathi</h1>
        <p className="mt-3 font-body text-text-primary/70 max-w-sm mx-auto">मी कोण आहे? / I am a...</p>
      </div>

      <div className="grid w-full max-w-sm gap-3">
        <RoleCard href="/sos" label="Warkari (Pilgrim)" sub="SOS, no login needed" accent />
        <RoleCard href="/concern" label="Raise a Concern" sub="No login needed" />
        <RoleCard href="/login" label="Volunteer / Doctor" sub="Login required" />
        <RoleCard href="/login" label="Dispatcher" sub="Login required" />
        <RoleCard href="/login" label="Responder" sub="Login required" />
        <RoleCard href="/login" label="Admin" sub="Login required" />
      </div>

      <p className="font-mono text-xs text-text-primary/30">V26-GF-023</p>
    </main>
  );
}

function RoleCard({ href, label, sub, accent = false }: { href: string; label: string; sub: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between border ${
        accent
          ? "bg-accent-saffron/10 border-accent-saffron/30 hover:bg-accent-saffron/15"
          : "bg-surface-raised border-black/10"
      }`}
    >
      <span className="font-body font-semibold text-text-primary">{label}</span>
      <span className="font-body text-xs text-text-primary/50">{sub}</span>
    </Link>
  );
}