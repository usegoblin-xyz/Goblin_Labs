import { useEffect, useState } from "react";
import { UserProfile, useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router";

// Clerk UserProfile themed to the dark goblin look.
const profileAppearance = {
  variables: {
    colorPrimary: "#22a03a",
    colorBackground: "#0d1512",
    colorInputBackground: "#141d18",
    colorText: "#f3f5f2",
    colorTextSecondary: "#9aa79d",
    colorInputText: "#f3f5f2",
    colorDanger: "#ef6b5e",
    borderRadius: "0.75rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border border-white/10 rounded-2xl",
    card: "bg-[#0d1512]",
    navbar: "bg-[#0b120e] border-r border-white/10",
    navbarButton: "!text-[#9aa79d] hover:!text-white",
    headerTitle: "!text-white",
    headerSubtitle: "!text-[#9aa79d]",
    profileSectionTitleText: "!text-white",
    formButtonPrimary:
      "!bg-[#22a03a] hover:!bg-[#178a2e] !text-white !shadow-none normal-case",
    badge: "!bg-[#22a03a]/15 !text-[#4cd166]",
  },
} as const;

type MyPersona = {
  anamPersonaId: string;
  name: string;
  vertical: string | null;
  createdAt?: string;
};

export default function Account() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [personas, setPersonas] = useState<MyPersona[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Bounce to sign-in if not authed (client-side guard; API stays the source of truth).
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = "/login?redirect=/account";
    }
  }, [isLoaded, isSignedIn]);

  // Load the user's deployed personas so they can grab embed codes.
  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const r = await fetch("/api/personas-mine", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!r.ok) return setPersonas([]);
        const data = (await r.json()) as { personas?: MyPersona[] };
        setPersonas(data.personas ?? []);
      } catch {
        setPersonas([]);
      }
    })();
  }, [isSignedIn, getToken]);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://usegoblin.xyz";

  const embedSnippet = (id: string) =>
    `<iframe src="${origin}/embed/${id}" width="420" height="640" style="border:0;border-radius:16px;max-width:100%" allow="camera; microphone; autoplay" title="Goblin Labs Persona"></iframe>`;

  const scriptSnippet = (id: string, name: string) =>
    `<script src="${origin}/embed.js" data-persona="${id}" data-label="Ask ${name}" defer></script>`;

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } catch {
      /* clipboard blocked; user can select manually */
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Loading your account…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-dashed border-white/10">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon-192.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-[16px] font-bold tracking-tight">Goblin Labs</span>
          </Link>
          <Link
            to="/studio"
            className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            Studio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold tracking-tight">
            {user?.firstName ? `Hi, ${user.firstName}` : "Your account"}
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Manage your profile, security, and connected accounts. Grab embed
            codes for the personas you&rsquo;ve deployed.
          </p>
        </div>

        {/* Profile management (Clerk) */}
        <section className="mb-12">
          <UserProfile routing="path" path="/account" appearance={profileAppearance} />
        </section>

        {/* Embeddable personas */}
        <section>
          <h2 className="text-[18px] font-bold tracking-tight">Embed your personas</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Drop a persona onto any website. The iframe embeds the full talk
            experience; the script adds a floating &ldquo;Ask&rdquo; launcher.
          </p>

          {personas === null && (
            <p className="mt-6 text-[14px] text-muted-foreground">Loading personas…</p>
          )}

          {personas?.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-white/12 p-6 text-[14px] text-muted-foreground">
              You haven&rsquo;t deployed any personas yet.{" "}
              <Link to="/studio" className="text-[#4cd166] hover:underline">
                Build one in the Studio
              </Link>{" "}
              and it&rsquo;ll show up here with its embed code.
            </div>
          )}

          <div className="mt-6 grid gap-4">
            {personas?.map((p) => (
              <div
                key={p.anamPersonaId}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold">{p.name}</div>
                    <div className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
                      {p.vertical || "Persona"}
                    </div>
                  </div>
                  <a
                    href={`/p/${p.anamPersonaId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/15 px-3 py-1.5 text-[12px] text-foreground/80 hover:border-white/30 hover:text-foreground"
                  >
                    Open talk page
                  </a>
                </div>

                <EmbedField
                  label="Iframe embed"
                  value={embedSnippet(p.anamPersonaId)}
                  copied={copied === `iframe-${p.anamPersonaId}`}
                  onCopy={() => copy(embedSnippet(p.anamPersonaId), `iframe-${p.anamPersonaId}`)}
                />
                <EmbedField
                  label="Floating launcher (script)"
                  value={scriptSnippet(p.anamPersonaId, p.name)}
                  copied={copied === `script-${p.anamPersonaId}`}
                  onCopy={() => copy(scriptSnippet(p.anamPersonaId, p.name), `script-${p.anamPersonaId}`)}
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function EmbedField({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-foreground/80">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md bg-[#22a03a] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#178a2e]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <code className="block overflow-x-auto whitespace-pre rounded-lg border border-white/10 bg-black/40 p-3 text-[12px] leading-relaxed text-[#c3cec1]">
        {value}
      </code>
    </div>
  );
}
