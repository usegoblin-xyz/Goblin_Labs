import type { Category, Template } from "./kit";
import { launchTitle } from "./templates/LaunchTitle";
import { featureSpotlight } from "./templates/FeatureSpotlight";
import { statCounter } from "./templates/StatCounter";
import { barChart } from "./templates/BarChart";
import { logoReveal } from "./templates/LogoReveal";
import { changelogDrop } from "./templates/ChangelogDrop";
import { testimonial } from "./templates/Testimonial";
import { endCard } from "./templates/EndCard";

// Order here is the order on the homepage.
export const TEMPLATES = [
  launchTitle,
  featureSpotlight,
  changelogDrop,
  statCounter,
  barChart,
  logoReveal,
  testimonial,
  endCard,
] as unknown as Template[];

export const CATEGORIES: ("All" | Category)[] = ["All", "Launch", "Product", "Data", "Brand", "Social"];

export function aspectLabel(t: Template) {
  if (t.width === t.height) return "1:1";
  return t.width > t.height ? "16:9" : "9:16";
}

export function seconds(t: Template) {
  return Math.round(t.durationInFrames / t.fps);
}

export function matches(t: Template, q: string) {
  if (!q.trim()) return true;
  const hay = [t.title, t.outcome, t.category, ...t.tags].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}
