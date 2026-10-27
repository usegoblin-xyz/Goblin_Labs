import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { track } from "@/app/lib/analytics";
import { useUser } from "@/app/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// UTM tags from the landing URL, so we know which post or issue a subscriber came from.
function utm() {
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["source", "medium", "campaign"]) {
    const v = p.get(`utm_${k}`);
    if (v) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

// Footer "Stay updated" form: saves the email and adds it to the Goblin newsletter.
export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, hidden from people
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  const value = email || user?.primaryEmailAddress.emailAddress || "";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const v = value.trim();
    if (!EMAIL_RE.test(v)) return setError("Enter a valid email address.");
    setState("busy");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: v, source, page: window.location.href, utm: utm(), website }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || "Something went wrong. Try again in a moment.");
      }
      track("newsletter_subscribed", { source });
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  };

  return (
    <div className="max-w-[440px]">
      <h3 className="text-[15px] font-semibold text-white">Stay updated</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-white/50">
        New templates and the best founder launch videos, every two weeks. No spam, unsubscribe anytime.
      </p>
      {state === "done" ? (
        <p className="mt-4 flex items-center gap-2 text-[13.5px] text-[#5fd67a]">
          <Check className="h-4 w-4" /> You're in. Look out for a welcome email from Goblin.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex gap-2" noValidate>
          <input
            type="email"
            value={value}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="you@company.com"
            autoComplete="email"
            aria-label="Email address"
            className="h-10 min-w-0 flex-1 rounded-lg border border-white/12 bg-white/[0.04] px-3 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#22A03A]"
          />
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            name="website"
          />
          <button
            disabled={state === "busy"}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#22A03A] px-4 text-[13px] font-semibold text-black hover:opacity-90 disabled:opacity-60"
          >
            {state === "busy" ? "Subscribing…" : <>Subscribe <ArrowRight className="h-3.5 w-3.5" /></>}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-[12.5px] text-[#ff6b5e]">{error}</p>}
    </div>
  );
}
