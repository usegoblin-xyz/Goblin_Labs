// PostHog product analytics (posthog-js, US Cloud). Does nothing until
// VITE_POSTHOG_KEY is set, and never runs on localhost, so local dev sends no
// test data. Signed-in users are identified by their Better Auth user id.
import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

let ready = false;

function isLocal() {
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}

export function initAnalytics() {
  if (ready || !KEY || typeof window === "undefined" || isLocal()) return;
  posthog.init(KEY, {
    api_host: HOST,
    defaults: "2026-08-30", // latest config snapshot: SPA pageviews, autocapture, web vitals
    person_profiles: "identified_only", // anonymous visitors don't create person profiles
  });
  ready = true;
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
};

export function track<E extends keyof Events>(event: E, props: Events[E]) {
  if (!ready) return;
  posthog.capture(event, props);
}
