import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Search } from "lucide-react";
import { toast } from "sonner";
import goblinLogo from "@/assets/goblin-logo.png";
import { DEFAULT_BRAND, type Brand } from "@/library/brand";
import type { Category, Template } from "@/library/kit";
import { CATEGORIES, TEMPLATES, aspectLabel, matches, seconds } from "@/library/registry";
import { BrandBar } from "@/library/ui/BrandBar";
import { hasPrompt } from "@/library/prompts";
import { LivePlayer } from "@/library/ui/LivePlayer";
import { TemplateDialog } from "@/library/ui/TemplateDialog";
import { captureContact } from "@/app/lib/leads";

type Content = Record<string, string | number>;
const BRAND_KEY = "goblin_brand_kit";

function loadBrand(): Brand {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (raw) return { ...DEFAULT_BRAND, ...JSON.parse(raw) };
  } catch {
    /* storage blocked — fall back to default */
  }
  return DEFAULT_BRAND;
}

const STEPS = [
  { n: "01", title: "Set your brand once", body: "Name, colors, font and motion feel. Every template reads from the same kit." },
  { n: "02", title: "Pick by outcome", body: "Launch intro, feature drop, changelog, traction post. Fill in your copy." },
  { n: "03", title: "Render and post", body: "Export an MP4 in 16:9, square or vertical. Rendering opens to the waitlist first." },
];

export default function Home() {
  const [brand, setBrand] = useState<Brand>(loadBrand);
  const [overrides, setOverrides] = useState<Record<string, Content>>({});
  const [category, setCategory] = useState<"All" | Category>("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Template | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
    } catch {
      /* ignore */
    }
  }, [brand]);

  const contentFor = (t: Template): Content => overrides[t.id] ?? (t.defaults as Content);
  const shown = useMemo(
    () => TEMPLATES.filter((t) => (category === "All" || t.category === category) && matches(t, query)),
    [category, query],
  );
  const hero = TEMPLATES[0];

  const goWaitlist = () => {
    setOpen(null);
    setTimeout(() => {
      document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" });
      emailRef.current?.focus({ preventScroll: true });
    }, 150);
  };

  const join = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    setSending(true);
    try {
      await captureContact("motion-waitlist", { email, company: brand.name, need: "Motion library waitlist" });
      toast.success("You're on the list", { description: "We'll email you when rendering opens." });
      setEmail("");
    } catch {
      toast.error("Something went wrong. Try again in a moment.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-full bg-black text-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src={goblinLogo} alt="" className="h-7 w-7 rounded-md" />
            <span className="text-[15px] font-semibold tracking-tight">Goblin</span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#library" className="rounded-full px-3 py-1.5 text-[13px] text-white/70 hover:text-white">
              Library
            </a>
            <a href="#how" className="hidden rounded-full px-3 py-1.5 text-[13px] text-white/70 hover:text-white sm:inline">
              How it works
            </a>
            <button
              onClick={goWaitlist}
              className="rounded-full bg-[#22A03A] px-4 py-1.5 text-[13px] font-semibold text-black hover:opacity-90"
            >
              Join waitlist
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[320px] w-[70%] rounded-full bg-[#22A03A]/12 blur-[110px]" />
        </div>
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-4 pt-14 pb-10 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-20">
          <div>
            <h1 className="text-[44px] leading-[1.02] font-semibold tracking-[-0.035em] sm:text-[60px]">
              Launch videos that already look like{" "}
              <span style={{ fontFamily: "Instrument Serif, serif" }} className="font-normal italic text-[#22A03A]">
                your brand.
              </span>
            </h1>
            <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-white/65">
              Ready-made motion for launches, feature drops, changelogs and traction posts. Set your colors, font and
              motion feel once, and every template follows.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#library"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-black hover:opacity-90"
              >
                Browse the library <ArrowRight className="h-4 w-4" />
              </a>
              <button
                onClick={goWaitlist}
                className="rounded-full border border-white/20 px-6 py-3 text-[14px] font-medium text-white/85 hover:border-white/50"
              >
                Get early access
              </button>
            </div>
          </div>
          <button
            onClick={() => setOpen(hero)}
            className="group relative block w-full overflow-hidden rounded-2xl border border-white/12 text-left shadow-[0_40px_120px_rgba(34,160,58,0.15)]"
            aria-label={`Open ${hero.title}`}
          >
            <LivePlayer template={hero} brand={brand} content={contentFor(hero)} className="aspect-video w-full" />
          </button>
        </div>
      </section>

      {/* Brand kit — sticky so every change is visible against the grid */}
      <div className="z-30 mx-auto md:sticky md:top-14 max-w-[1240px] px-4 pt-2 sm:px-6">
        <BrandBar brand={brand} onChange={setBrand} />
      </div>

      {/* Library */}
      <section id="library" className="mx-auto max-w-[1240px] scroll-mt-36 px-4 pt-12 pb-20 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">The library</h2>
            <p className="mt-1 text-[15px] text-white/55">
              {TEMPLATES.length} templates, each restyled live by your brand kit. Click one to edit the copy.
            </p>
          </div>
          <label className="relative block sm:w-[300px]">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by what you're making"
              aria-label="Search templates"
              className="h-10 w-full rounded-full border border-white/12 bg-white/[0.04] pr-4 pl-9 text-[14px] outline-none placeholder:text-white/35 focus:border-[#22A03A]"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                category === c
                  ? "border-white bg-white font-medium text-black"
                  : "border-white/12 text-white/65 hover:border-white/35 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/55">
            Nothing matches “{query}” yet.{" "}
            <button onClick={goWaitlist} className="text-[#22A03A] underline-offset-4 hover:underline">
              Tell us what you need
            </button>{" "}
            and we'll build it.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((t) => (
              <button
                key={t.id}
                onClick={() => setOpen(t)}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] text-left transition-colors hover:border-white/30"
              >
                <LivePlayer template={t} brand={brand} content={contentFor(t)} className="aspect-video w-full" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-semibold">{t.title}</h3>
                    <div className="flex shrink-0 gap-1.5 text-[11px] text-white/45">
                      <span>{aspectLabel(t)}</span>
                      <span>·</span>
                      <span>{seconds(t)}s</span>
                      {hasPrompt(t) && (
                        <>
                          <span>·</span>
                          <span className="text-[#22A03A]">Prompt</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-white/55">{t.outcome}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-white/8">
        <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
          <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
                <div className="font-mono text-[12px] text-[#22A03A]">{s.n}</div>
                <h3 className="mt-3 text-[17px] font-semibold">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="border-t border-white/8">
        <div className="mx-auto max-w-[720px] px-4 py-20 text-center sm:px-6">
          <h2 className="text-[32px] leading-tight font-semibold tracking-tight sm:text-[40px]">
            Get rendering first
          </h2>
          <p className="mx-auto mt-3 max-w-[480px] text-[15px] text-white/60">
            MP4 export and saved brand kits are coming soon. Join the waitlist and we'll send you early access.
          </p>
          <form onSubmit={join} className="mx-auto mt-7 flex max-w-[440px] flex-col gap-2 sm:flex-row">
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="Email"
              className="h-11 flex-1 rounded-full border border-white/15 bg-white/[0.04] px-5 text-[14px] outline-none placeholder:text-white/35 focus:border-[#22A03A]"
            />
            <button
              disabled={sending}
              className="h-11 rounded-full bg-[#22A03A] px-6 text-[14px] font-semibold text-black hover:opacity-90 disabled:opacity-60"
            >
              {sending ? "Joining…" : "Join waitlist"}
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-8 text-[12px] text-white/40 sm:flex-row sm:justify-between sm:px-6">
          <span>© 2026 Goblin Labs</span>
          <span>Previews render live in your browser with Remotion.</span>
        </div>
      </footer>

      <TemplateDialog
        template={open}
        brand={brand}
        content={open ? contentFor(open) : {}}
        onContent={(c) => open && setOverrides((o) => ({ ...o, [open.id]: c }))}
        onClose={() => setOpen(null)}
        onWaitlist={goWaitlist}
      />
    </div>
  );
}
