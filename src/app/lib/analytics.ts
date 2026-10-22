// PostHog product analytics. Does nothing until VITE_POSTHOG_KEY is set, so
// local dev and preview builds without the key send no data.
import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

let ready = false;

export function initAnalytics() {
  if (ready || !KEY || typeof window === "undefined") return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: "history_change", // SPA route changes count as pageviews
    person_profiles: "identified_only", // anonymous visitors don't create person profiles
  });
  ready = true;
}

// Events the motion library cares about. Keep names stable: dashboards and
// funnels in PostHog are built on them.
type Events = {
  template_opened: { template: string; category: string };
  brand_preset_applied: { preset: string };
  brand_customized: { field: string };
  library_searched: { query: string; results: number };
  category_filtered: { category: string };
  render_clicked: { template: string };
  prompt_copied: { template: string };
  signup_gate_shown: { template: string };
  signup_completed: { source: string };
  waitlist_joined: { source: string };
};

export function track<E extends keyof Events>(event: E, props: Events[E]) {
  if (!ready) return;
  posthog.capture(event, props);
}
