// PostHog product analytics (posthog-js, US Cloud, proxied through /ingest). Does nothing until
// VITE_POSTHOG_KEY is set, and never runs on localhost, so local dev sends no
// test data. Signed-in users are identified by their Better Auth user id.
import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
// Events go through our own domain (/ingest, a Vercel rewrite to PostHog US
// Cloud) so ad blockers that block posthog.com don't drop them.
const HOST = "/ingest";

let ready = false;

function isLocal() {
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}

export function initAnalytics() {
  if (ready || !KEY || typeof window === "undefined" || isLocal()) return;
  posthog.init(KEY, {
    api_host: HOST,
    ui_host: "https://us.posthog.com", // links in the toolbar still open PostHog
    defaults: "2026-08-30", // latest config snapshot: SPA pageviews, autocapture, web vitals
    person_profiles: "identified_only", // anonymous visitors don't create person profiles
    // Consent: until a visitor accepts the cookie banner (or after they decline),
    // PostHog runs cookieless — no cookies or local storage, anonymous counts only.
    opt_out_capturing_by_default: true,
    cookieless_mode: "on_reject",
  });
  ready = true;
}

// Cookie banner state, as PostHog records it.
export type Consent = "granted" | "denied" | "pending";
export function consentStatus(): Consent {
  if (!ready) return "granted"; // analytics off (localhost / no key): nothing to ask
  return posthog.get_explicit_consent_status();
}
export function acceptAnalytics() {
  if (ready) posthog.opt_in_capturing();
}
export function declineAnalytics() {
  if (ready) posthog.opt_out_capturing();
}

// Link this browser's events to the signed-in user. The id is the stable
// Better Auth user id; email and name go on as person properties.
export function identifyUser(user: { id: string; email?: string | null; name?: string | null }) {
  if (!ready) return;
  if (posthog.get_distinct_id() === user.id) return;
  posthog.identify(user.id, { email: user.email ?? undefined, name: user.name ?? undefined });
}

// Call on sign-out so the next person on this browser doesn't inherit the identity.
export function resetUser() {
  if (!ready) return;
  posthog.reset();
}

// Events the motion library cares about. Keep names stable: dashboards and
// funnels in PostHog are built on them.
type Events = {
  template_opened: { template: string; category: string };
  brand_preset_applied: { preset: string };
  brand_customized: { field: string };
  library_searched: { query: string; results: number };
  category_filtered: { category: string };
  prompt_copied: { template: string };
  signup_gate_shown: { template: string };
  signup_completed: { source: string };
  signed_up: { method: "email" | "google" };
  signed_in: { method: "email" | "google" };
  signed_out: Record<string, never>;
  newsletter_subscribed: { source: string };
  studio_generate: { mode: "create" | "edit" | "repair"; aspect?: string; conversation_id: string };
  studio_generate_failed: { mode: "create" | "edit" | "repair"; status: number };
  studio_preview_error: { auto: boolean };
  studio_copied: { what: string };
  // One per message sent to Goblin, after it answers: what Goblin did with it.
  account_usage_opened: Record<string, never>;
  studio_media_attached: { kind: "image" | "video" | "audio" | "doc"; conversation_id: string };
  studio_clips_made: { what: "template" | "explainer"; clips: number };
  studio_chat: { conversation_id: string; turn: number; explainer_mode: boolean; action: "chat" | "build" | "change" | "explainer" | "edit" | "error" };
  studio_downloaded: Record<string, never>;
  studio_export_failed: Record<string, never>;
  studio_video: { conversation_id: string };
  studio_explainer_mode: { on: boolean };
  studio_video_done: Record<string, never>;
  studio_video_downloaded: Record<string, never>;
};

export function track<E extends keyof Events>(event: E, props: Events[E]) {
  if (!ready) return;
  posthog.capture(event, props);
}
