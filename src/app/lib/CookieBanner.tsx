// Cookie consent banner. Until a visitor accepts, PostHog runs cookieless
// (see analytics.ts); Accept turns on normal analytics, Decline keeps it
// cookieless. The choice is stored by PostHog, and "Cookie settings" in the
// footer reopens the banner.
import { useEffect, useState } from "react";
import { acceptAnalytics, consentStatus, declineAnalytics } from "./analytics";

const EVENT = "goblin:cookie-settings";
export const openCookieSettings = () => window.dispatchEvent(new Event(EVENT));

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (consentStatus() === "pending") setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(EVENT, reopen);
    return () => window.removeEventListener(EVENT, reopen);
  }, []);

  if (!open) return null;
  const choose = (accept: boolean) => {
    if (accept) acceptAnalytics();
    else declineAnalytics();
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-[560px] rounded-2xl border border-white/12 bg-[#0d0d0d]/95 p-4 text-white shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-4 sm:bottom-4 sm:p-5"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <p className="text-[13.5px] leading-relaxed text-white/80">
        We use essential cookies to keep you signed in. With your OK, we also use analytics cookies to understand how Goblin
        is used. No ads, ever.{" "}
        <a href="/privacy#cookies" className="text-[#5fd67a] underline">Learn more</a>
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => choose(true)} className="h-9 flex-1 rounded-lg border border-white/20 px-4 text-[13px] font-semibold text-white hover:border-white/40 sm:flex-none">
          Accept
        </button>
        <button onClick={() => choose(false)} className="h-9 flex-1 rounded-lg border border-white/20 px-4 text-[13px] font-semibold text-white hover:border-white/40 sm:flex-none">
          Decline
        </button>
      </div>
    </div>
  );
}
