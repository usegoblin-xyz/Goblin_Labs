import type { Template } from "./kit";

// The bulk of the library. Each entry carries its metadata eagerly and loads
// its component only when a card or render first needs it, so the homepage
// bundle stays small however many templates there are.
type Entry = Omit<Template, "component" | "lazy"> & { lazy: () => Promise<{ default: unknown }> };

const ENTRIES: Entry[] = [
  {
    id: "landing-flyover",
    title: "Landing Page Fly-over",
    outcome: "One continuous 3D camera flight over your landing page, ending on a title card",
    category: "Launch",
    tags: ["3D", "landing page", "website", "camera", "title card"],
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 435,
    defaults: {"headline": "Motion that already looks like your brand", "sub": "Templates for every launch, styled by your kit.", "cta": "Get started free", "statement": "Launch videos, on brand", "tail": "in minutes."},
    fields: [
      { key: "headline", label: "Hero headline", type: "text" },
      { key: "sub", label: "Hero subline", type: "text" },
      { key: "cta", label: "Button", type: "text" },
      { key: "statement", label: "Closing line", type: "text" },
      { key: "tail", label: "Italic tail", type: "text" }
    ],
    lazy: () => import("./templates/lib/LandingFlyover"),
  },
  // @catalog-end
];

export const CATALOG = ENTRIES as unknown as Template[];
