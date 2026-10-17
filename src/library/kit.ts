import type { ComponentType } from "react";
import { spring, interpolate, Easing } from "remotion";
import { FONTS, MOTIONS, type Brand } from "./brand";

// Every template receives the brand kit plus its own content fields.
export type TemplateProps<C> = { brand: Brand; content: C };

export type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number";
  hint?: string;
};

export type Category = "Launch" | "Product" | "Data" | "Brand" | "Social";

export type Template<C = Record<string, string | number>> = {
  id: string;
  title: string;
  outcome: string; // what you make with it, in the buyer's words
  category: Category;
  tags: string[];
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  component: ComponentType<TemplateProps<C>>;
  defaults: C;
  fields: Field[];
};

export const font = (b: Brand) => FONTS[b.font].stack;

// Brand-aware entrance: 0 → 1 using the kit's motion feel.
export function enter(frame: number, fps: number, brand: Brand, delay = 0) {
  return spring({
    frame: frame - delay,
    fps,
    config: MOTIONS[brand.motion].config,
  });
}

// Linear-time fade/slide helper with clamping and an ease-out curve.
export function ramp(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

// Shared outro: everything eases away over the last `len` frames so loops
// read as deliberate instead of snapping back to frame 0.
export function outro(frame: number, total: number, len = 14) {
  return interpolate(frame, [total - len, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
}

export const list = (s: string | number) =>
  String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
