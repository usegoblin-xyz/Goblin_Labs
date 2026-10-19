import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Track, c01, expInOut, expOut, fit, fontOf, hash, lum, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { services: string; role: string };

// A studio intro printed on a risograph: two inks pass one after the other
// with slight misregistration and grain, overprinting where they cross. Four
// sheets roll through on the beat (halftone sun, big numerals, overlapping
// circles, a services list), then the last sheet carries your name.
const PAPER = "#f3efe6";
const SHEET_T = [0.3, 2.1, 3.9, 5.7, 7.5];

export default function RisoStudio({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const services = [...list(c.services || "Posters, Zines, Identity, Print"), "Print", "Print", "Print", "Print"].slice(0, 4);
  const ink1 = pal.p;
  const ink2 = lum(pal.a) > 0.6 ? mix(pal.a, "#1a1aa0", 0.55) : pal.a;

  const sheet = SHEET_T.reduce((k, at, i) => (t >= at ? i : k), 0);
  const local = t - SHEET_T[sheet];
  // each sheet rolls in from the bottom, then each ink "prints" top-down
  const feed = expInOut(seg(local, 0, 0.45));
  const pass1 = c01((local - 0.35) / 0.4);
  const pass2 = c01((local - 0.65) / 0.4);
  const mis = (k: number) => (hash(sheet, k) - 0.5) * 10 + Math.sin(t * 7 + k) * 1.5;

  const layer = (ink: string, pass: number, k: number, children: ReactNode, id: string) => (
    <g style={{ mixBlendMode: "multiply" }} transform={`translate(${mis(k)} ${mis(k + 3)})`} clipPath={`url(#riso-pass-${id}-${k})`}>
      <defs>
        <clipPath id={`riso-pass-${id}-${k}`}>
          <rect x={0} y={0} width={1920} height={1080 * pass} />
        </clipPath>
      </defs>
      <g fill={ink} stroke={ink}>
        {children}
      </g>
    </g>
  );

  const halftone = (cx: number, cy: number, r: number, step = 26) => {
    const dots: ReactNode[] = [];
    for (let x = cx - r; x <= cx + r; x += step)
      for (let y = cy - r; y <= cy + r; y += step) {
        const d = Math.hypot(x - cx, y - cy) / r;
        if (d > 1) continue;
        dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={(1 - d) * step * 0.55 + 1} stroke="none" />);
      }
    return dots;
  };

  const big = (s: string, x: number, y: number, size: number, anchor: "start" | "middle" = "middle") => (
    <text x={x} y={y} textAnchor={anchor} fontFamily={ff} fontSize={size} fontWeight={900} letterSpacing="-0.05em" stroke="none">
      {s}
    </text>
  );

  const contentFor = (sheet: number, local: number): [ReactNode, ReactNode] => {
  let one: ReactNode = null;
  let two: ReactNode = null;
  if (sheet === 0) {
    one = halftone(1180, 470, 330);
    two = big(name.toUpperCase(), 160, 860, fit(name.toUpperCase(), 1500, 260, 900), "start");
  } else if (sheet === 1) {
    one = big("01", 160, 820, 760, "start");
    two = (
      <>
        <rect x={1060} y={180} width={700} height={700} stroke="none" />
        {big("PRINT", 1410, 560, 170)}
      </>
    );
  } else if (sheet === 2) {
    one = [0, 1, 2].map((i) => <circle key={i} cx={620 + i * 340} cy={520} r={260} stroke="none" />);
    two = [0, 1].map((i) => <circle key={i} cx={790 + i * 340} cy={520} r={260} stroke="none" />);
  } else if (sheet === 3) {
    one = services.map((s, i) => big(s, 160, 300 + i * 190, 170, "start"));
    two = services.map((_, i) => <rect key={i} x={140} y={318 + i * 190} width={1640 * c01((local - 0.7 - i * 0.12) / 0.3)} height={28} stroke="none" />);
  } else {
    one = (
      <>
        {halftone(1500, 300, 220, 22)}
        {big(name, 160, 640, fit(name, 1550, 300, 900), "start")}
      </>
    );
    two = (
      <>
        <rect x={160} y={700} width={720} height={16} stroke="none" />
        <text x={160} y={800} fontFamily={ff} fontSize={46} fontWeight={700} stroke="none">
          {c.role || "Risograph & print studio"}
        </text>
      </>
    );
  }
  return [one, two];
  };

  const sheetSvg = (k: number, p1: number, p2: number, loc: number, id: string) => {
    const [one, two] = contentFor(k, loc);
    return (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={`riso-grain-${id}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={k + 1} />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
        {layer(ink1, p1, 1, one, id)}
        {layer(ink2, p2, 2, two, id)}
        <rect width={1920} height={1080} fill={PAPER} filter={`url(#riso-grain-${id})`} opacity={0.55} style={{ mixBlendMode: "multiply" }} />
        <text x={1760} y={1040} textAnchor="end" fontFamily={ff} fontSize={20} fill="#00000066">
          {`${k + 1}/5 · 2-color riso`}
        </text>
      </svg>
    );
  };

  const prevY = sheet > 0 ? -1080 * feed : 0;
  return (
    <AbsoluteFill style={{ background: "#2b2a27", overflow: "hidden", fontFamily: ff }}>
      {/* outgoing sheet slides up as the new one feeds in */}
      <div style={{ position: "absolute", inset: 0, background: PAPER, transform: `translateY(${sheet === 0 ? (1 - feed) * 1080 : 0}px)` }}>
        {sheetSvg(sheet, pass1, pass2, local, "cur")}
      </div>
      {sheet > 0 && feed < 1 && (
        <div style={{ position: "absolute", inset: 0, background: PAPER, transform: `translateY(${prevY}px)`, boxShadow: "0 30px 50px rgba(0,0,0,0.4)" }}>{sheetSvg(sheet - 1, 1, 1, 5, "prev")}</div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26, background: "linear-gradient(180deg, rgba(0,0,0,0.25), transparent)", opacity: expOut(seg(local, 0, 0.3)) }} />
      <Track src="tracks/riso-studio.wav" on={audio} />
    </AbsoluteFill>
  );
}
