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
  {
    id: "ask-think-deliver",
    title: "Ask, Think, Deliver",
    outcome: "An AI assistant film: a typed request, a playful think, results on the drop, done",
    category: "Launch",
    tags: ["AI", "assistant", "chat", "phone", "launch", "music"],
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 450,
    defaults: {"request": "I am really hungry, I do not know / what I want but something / spicy, crispy and filling", "thinking": "Finding something for you\u2026", "results": "Fire Noodles, Birria Tacos, Smash Burger, Buffalo Wings, Spicy Ramen, Hot Chicken", "answer": "Found it. Smoky, spicy and seriously filling.", "question": "Want me to order it for you?", "line1": "You were craving noodles.", "line2": "Now it is on the way."},
    fields: [
      { key: "request", label: "Request (3 lines, split with /)", type: "textarea" },
      { key: "thinking", label: "Thinking text", type: "text" },
      { key: "results", label: "Six results", type: "text", hint: "Comma separated; the first is the pick" },
      { key: "answer", label: "Answer", type: "text" },
      { key: "question", label: "Follow-up", type: "text" },
      { key: "line1", label: "Closing line 1", type: "text" },
      { key: "line2", label: "Closing line 2", type: "text" }
    ],
    soundtrack: "tracks/ask-think-deliver.wav",
    lazy: () => import("./templates/lib/AskThinkDeliver"),
  },
  {
    id: "model-launch-square",
    title: "Model Launch, Square",
    outcome: "A square launch film for a generative model: glass controls, live captions, image bursts",
    category: "Launch",
    tags: ["AI", "model", "square", "captions", "images", "music"],
    width: 1080,
    height: 1080,
    fps: 30,
    durationInFrames: 480,
    defaults: {"pitch": "An image model made for taste.", "prompt": "a quiet harbour at dawn, ink on paper", "verb": "Create", "settings": "Lighting, Mood, Detail", "outro": "Out now"},
    fields: [
      { key: "pitch", label: "Pitch line", type: "text" },
      { key: "prompt", label: "Typed prompt", type: "text" },
      { key: "verb", label: "Verb", type: "text" },
      { key: "settings", label: "Three settings", type: "text" },
      { key: "outro", label: "Outro", type: "text" }
    ],
    soundtrack: "tracks/model-launch-square.wav",
    lazy: () => import("./templates/lib/ModelLaunchSquare"),
  },
  {
    id: "dot-system",
    title: "One Dot, Every Scene",
    outcome: "A looping motion film where one brand dot becomes a toggle, a spring, a shape and your end card",
    category: "Brand",
    tags: ["dot", "loop", "spring", "kinetic type", "halftone", "music"],
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 450,
    defaults: {"label": "Reduce Motion", "hero": "Motion", "stat": "+22%", "words": "SPRINGS, EASING, KINETIC TYPE, 3D, SOUND", "line": "Motion, by design.", "note": "0 keyframes"},
    fields: [
      { key: "label", label: "Toggle label", type: "text" },
      { key: "hero", label: "Hero word (part of the label)", type: "text" },
      { key: "stat", label: "Graph callout", type: "text" },
      { key: "words", label: "Orbiting words", type: "text" },
      { key: "line", label: "End card line", type: "text" },
      { key: "note", label: "End card note", type: "text" }
    ],
    soundtrack: "tracks/dot-system.wav",
    lazy: () => import("./templates/lib/DotSystem"),
  },
  // @catalog-end
];

export const CATALOG = ENTRIES as unknown as Template[];
