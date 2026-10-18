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
  {
    id: "ball-ui-loop",
    title: "Ball Through the UI",
    outcome: "A ball runs a toggle, slider, notifications and keyboard in one seamless loop",
    category: "Product",
    tags: ["UI", "loop", "interaction", "keyboard", "slider", "music"],
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
    defaults: {"target": "100", "note1": "Slider \u00b7 Reached 100", "note2": "Gravity \u00b7 Something is falling", "note3": "Messages \u00b7 What now?", "reply": "retry"},
    fields: [
      { key: "target", label: "Slider value", type: "text" },
      { key: "note1", label: "Notification 1 (Title \u00b7 message)", type: "text" },
      { key: "note2", label: "Notification 2", type: "text" },
      { key: "note3", label: "Notification 3", type: "text" },
      { key: "reply", label: "Typed reply", type: "text", hint: "Up to 9 letters" }
    ],
    soundtrack: "tracks/ball-ui-loop.wav",
    lazy: () => import("./templates/lib/BallUILoop"),
  },
  // @catalog-end
];

export const CATALOG = ENTRIES as unknown as Template[];
