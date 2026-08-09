import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-accent-saffron">VariSaarathi</h1>
        <p className="mt-2 text-text-primary/70 max-w-sm">मी कोण आहे? / I am a...</p>
      </div>

      <div className="grid w-full max-w-sm gap-3">
        <RoleCard href="/sos" label="Warkari (Pilgrim)" sub="SOS, no login needed" />
        <RoleCard href="/concern" label="Raise a Concern" sub="No login needed" />
        <RoleCard href="/login" label="Volunteer / Doctor" sub="Login required" />
        <RoleCard href="/login" label="Dispatcher" sub="Login required" />
        <RoleCard href="/login" label="Responder" sub="Login required" />
        <RoleCard href="/login" label="Admin" sub="Login required" />
      </div>
    </main>
  );
}

function RoleCard({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-surface-raised border border-black/10 px-5 py-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
    >
      <span className="font-body font-semibold">{label}</span>
      <span className="text-xs text-text-primary/50">{sub}</span>
    </Link>
  );
}