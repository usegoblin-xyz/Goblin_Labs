// Goblin's gecko, idling with "Blink and look": every few seconds the head
// turns, then the eye blinks. It's the real silhouette with the head cut out
// as its own piece (so at rest the parts line up into the exact mark), and an
// eyelid that closes over the eye hole. Plain colour, no tile behind it.
import { useId } from "react";
import { GECKO_PATH } from "@/library/gecko";
import { cn } from "./utils";

// The head piece, and the same outline with a hairline overlap for the body's cut-out.
const HEAD = "57,-2 102,-2 102,30 70,28 62,22 56,14";

// The animation (gkm-look, gkm-lid) lives in src/styles/index.css.

export function GeckoMark({ className, color = "#ffffff", label = "Goblin" }: { className?: string; color?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    // An empty label makes it decorative (hidden from screen readers), e.g. beside a heading.
    <svg className={cn("gkm block", className)} viewBox="-6 -8 112 112" {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      <defs>
        <path id={`${id}-gk`} d={GECKO_PATH} />
        <clipPath id={`${id}-head`} clipPathUnits="userSpaceOnUse">
          <polygon points={HEAD} />
        </clipPath>
        <mask id={`${id}-body`} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
          <rect x="-10" y="-10" width="120" height="120" fill="#fff" />
          <polygon points={HEAD} fill="#000" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
        </mask>
      </defs>
      <g fill={color}>
        <use href={`#${id}-gk`} mask={`url(#${id}-body)`} />
        <g className="head">
          <use href={`#${id}-gk`} clipPath={`url(#${id}-head)`} />
          <ellipse className="lid" cx="82.3" cy="15" rx="4.6" ry="3.9" />
        </g>
      </g>
    </svg>
  );
}
