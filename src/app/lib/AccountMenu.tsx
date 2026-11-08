// The account menu at the foot of the sidebar, shaped like Claude's: your
// avatar, name and plan, and a chevron. Clicking it opens a menu upwards with
// your email, Settings, Usage, help, the newsletter, the legal pages and
// Log out. Settings opens the account console; Usage shows today's limits.
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { ChevronDown, ChevronRight, CircleHelp, Gauge, Info, LogOut, Newspaper, Settings, X } from "lucide-react";
import { authErrorMessage, signOut, useUser } from "./auth";
import { openCookieSettings } from "./CookieBanner";
import { track } from "./analytics";

const AccountConsole = lazy(() => import("./AccountConsole").then((m) => ({ default: m.AccountConsole })));
type ConsoleTab = "profile" | "security" | "danger";

const PLAN = "Free";
const HELP_URL = "mailto:obinnaamadie@gmail.com?subject=Goblin%20help";
const NEWSLETTER_URL = "https://goblinlabs.substack.com";

export function Initials({ name, image, size = 28 }: { name: string; image?: string | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.12] font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {image ? <img src={image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : (name[0] ?? "?").toUpperCase()}
    </span>
  );
}

type Limit = { key: string; label: string; used: number; limit: number };

function UsagePanel({ onClose }: { onClose: () => void }) {
  const [limits, setLimits] = useState<Limit[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/studio?op=usage", { credentials: "include" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Couldn't load your usage.");
        setLimits(j.limits);
      })
      .catch((e: Error) => setError(e.message));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label="Usage"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] rounded-2xl border border-white/12 bg-[#0a0a0a] p-6 text-[#f5f5f2] shadow-2xl"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold tracking-tight">Usage</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[13px] text-white/50">{PLAN} plan · counted over the last 24 hours</p>
        <div className="mt-5 space-y-4">
          {error && <p className="text-[13px] text-[#ff6b5e]">{error}</p>}
          {!error && !limits && <p className="text-[13px] text-white/45">Loading…</p>}
          {limits?.map((l) => {
            const pct = Math.min(100, l.limit ? (l.used / l.limit) * 100 : 0);
            return (
              <div key={l.key}>
                <div className="flex items-baseline justify-between text-[13.5px]">
                  <span>{l.label}</span>
                  <span className="tabular-nums text-white/55">
                    {l.used} of {l.limit}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className={`h-full rounded-full ${pct >= 100 ? "bg-[#ff6b5e]" : "bg-[#5fd67a]"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const row = "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[14px] text-white/85 hover:bg-white/[0.07] hover:text-white";
const ic = "h-[17px] w-[17px] text-white/60";

export function AccountMenu() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [consoleTab, setConsoleTab] = useState<ConsoleTab | null>(null);
  const [linkError, setLinkError] = useState("");
  const [usage, setUsage] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeUsage = useCallback(() => setUsage(false), []);

  // Coming back from connecting Google (?account=security) reopens the console.
  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("account");
    if (t === "profile" || t === "security" || t === "danger") {
      setConsoleTab(t);
      setLinkError(authErrorMessage(url.searchParams.get("error")));
      for (const k of ["account", "error", "error_description"]) url.searchParams.delete(k);
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, []);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => {
    if (!open) setMore(false);
  }, [open]);

  if (!user) return null;
  const email = user.primaryEmailAddress.emailAddress;
  const name = user.firstName || user.fullName || email.split("@")[0];
  const pick = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className="relative">
      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 bottom-full left-0 z-50 mb-2 rounded-2xl border border-white/10 bg-[#1a1a1a] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
        >
          <div className="truncate px-2.5 pt-1.5 pb-2 text-[13px] text-white/45">{email}</div>
          <button role="menuitem" className={row} onClick={pick(() => setConsoleTab("profile"))}>
            <Settings className={ic} /> Settings
          </button>
          <button role="menuitem" className={row} onClick={pick(() => { setUsage(true); track("account_usage_opened", {}); })}>
            <Gauge className={ic} /> Usage
          </button>
          <a role="menuitem" className={row} href={HELP_URL} onClick={() => setOpen(false)}>
            <CircleHelp className={ic} /> Get help
          </a>
          <div className="my-1.5 h-px bg-white/[0.08]" />
          <a role="menuitem" className={row} href={NEWSLETTER_URL} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            <Newspaper className={ic} /> Newsletter
          </a>
          <div className="relative">
            <button role="menuitem" aria-haspopup="menu" aria-expanded={more} className={row} onClick={() => setMore((m) => !m)}>
              <Info className={ic} /> <span className="flex-1">Learn more</span>
              <ChevronRight className={`h-4 w-4 text-white/45 transition-transform ${more ? "rotate-90" : ""}`} />
            </button>
            {more && (
              <div className="ml-7 border-l border-white/10 pl-2">
                <Link role="menuitem" to="/terms" className={`${row} py-1.5 text-[13.5px]`} onClick={() => setOpen(false)}>Terms</Link>
                <Link role="menuitem" to="/privacy" className={`${row} py-1.5 text-[13.5px]`} onClick={() => setOpen(false)}>Privacy</Link>
                <button role="menuitem" className={`${row} py-1.5 text-[13.5px]`} onClick={pick(openCookieSettings)}>Cookie settings</button>
              </div>
            )}
          </div>
          <div className="my-1.5 h-px bg-white/[0.08]" />
          <button
            role="menuitem"
            className={row}
            onClick={pick(async () => {
              await signOut().catch(() => {});
              window.location.href = "/";
            })}
          >
            <LogOut className={ic} /> Log out
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors ${open ? "bg-white/[0.07]" : "hover:bg-white/[0.05]"}`}
      >
        <Initials name={name} image={user.imageUrl} />
        <span className="min-w-0 flex-1 truncate text-[14px]">
          <span className="font-medium text-white">{name}</span>
          <span className="text-white/45"> · {PLAN}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/45 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {consoleTab && (
        <Suspense fallback={null}>
          <AccountConsole initialTab={consoleTab} initialError={linkError} onClose={() => { setConsoleTab(null); setLinkError(""); }} />
        </Suspense>
      )}
      {usage && <UsagePanel onClose={closeUsage} />}
    </div>
  );
}
