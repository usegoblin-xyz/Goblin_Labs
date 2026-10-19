import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, kf, mix, nameOf, onColor, palette, seg, spring, useT } from "../../motion";

type C = { projects: string; role: string };

// A portfolio as an infinite canvas: twelve project covers pop onto a board,
// the camera dives into one and its case page builds, pulls back, glides to
// another and dives again, then the board shuffles and settles under your name.
const COLS = 4;
const ROWS = 3;
const TW = 560;
const TH = 380;
const GX = 620;
const GY = 440;

function tilePos(i: number) {
  return { x: (i % COLS - (COLS - 1) / 2) * GX, y: (Math.floor(i / COLS) - (ROWS - 1) / 2) * GY };
}

function Cover({ i, title, pal, ff }: { i: number; title: string; pal: ReturnType<typeof palette>; ff: string }) {
  const bgs = [pal.p, pal.card2, pal.a, mix(pal.p, "#000000", 0.35), pal.fg, mix(pal.a, pal.p, 0.5)];
  const bg = bgs[i % bgs.length];
  const ink = onColor(bg);
  const kind = Math.floor(hash(i, 4) * 4);
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      <Svg w={TW} h={TH}>
        {kind === 0 && <circle cx={TW * 0.66} cy={TH * 0.45} r={120} fill={ink} opacity={0.9} />}
        {kind === 1 && <rect x={TW * 0.45} y={50} width={200} height={200} rx={30} fill={ink} opacity={0.9} transform={`rotate(12 ${TW * 0.6} 150)`} />}
        {kind === 2 && [0, 1, 2, 3].map((k) => <rect key={k} x={260 + k * 60} y={60} width={34} height={250} rx={17} fill={ink} opacity={0.3 + k * 0.2} />)}
        {kind === 3 && <path d={`M${TW * 0.45},${TH - 60} L${TW * 0.7},60 L${TW - 60},${TH - 60} Z`} fill={ink} opacity={0.9} />}
        <text x={34} y={TH - 34} fontFamily={ff} fontSize={34} fontWeight={800} fill={ink}>
          {title}
        </text>
        <text x={34} y={56} fontFamily={ff} fontSize={20} fontWeight={600} fill={ink} opacity={0.6}>
          {String(i + 1).padStart(2, "0")}
        </text>
      </Svg>
    </div>
  );
}

export default function PortfolioZoom({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const given = list(c.projects || "Atlas rebrand, Night Bus app, Field Notes, Orbit site");
  const filler = ["Type study", "Poster series", "Wayfinding", "Packaging", "Motion kit", "Annual report", "Icon set", "Zine"];
  // dive targets: the first project sits on tile 5, the second on tile 2
  const A = 5;
  const Bt = 2;
  const rest = [...given.slice(2), ...filler];
  const tileTitle = (i: number) => (i === A ? given[0] ?? "Project one" : i === Bt ? given[1] ?? "Project two" : rest[[0, 1, 3, 4, 6, 7, 8, 9, 10, 11].indexOf(i) % rest.length]);
  const pa = tilePos(A);
  const pb = tilePos(Bt);
  const camX = kf(t, [[0, 0], [1.2, 0], [2.0, pa.x], [3.6, pa.x], [4.4, pb.x], [5.8, pb.x], [6.6, 0]]);
  const camY = kf(t, [[0, 0], [1.2, 0], [2.0, pa.y], [3.6, pa.y], [4.4, pb.y], [5.8, pb.y], [6.6, 0]]);
  const zoom = kf(t, [[0, 0.5], [1.2, 0.5], [2.0, 1.9], [3.6, 1.9], [4.0, 1.0], [4.4, 1.9], [5.8, 1.9], [6.6, 0.5]]);
  const caseA = c01((t - 2.0) / 0.2) * (1 - c01((t - 3.5) / 0.2));
  const caseB = c01((t - 4.4) / 0.2) * (1 - c01((t - 5.7) / 0.2));
  const dim = expInOut(seg(t, 7.2, 0.6));
  const nameP = c01((t - 7.5) / 0.6);
  const roleP = c01((t - 8.0) / 0.6);

  const casePage = (local: number, title: string) => (
    <div style={{ position: "absolute", inset: 0, background: pal.bg, padding: 26, boxSizing: "border-box" }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: pal.fg, letterSpacing: "-0.02em", opacity: expOut(seg(local, 0, 0.3)) }}>{title}</div>
      <div style={{ fontSize: 14, color: pal.muted, marginTop: 6, opacity: expOut(seg(local, 0.1, 0.3)) }}>Brand identity · Motion · 2026</div>
      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <div style={{ flex: 2, height: 190, borderRadius: 10, background: `linear-gradient(135deg, ${pal.p}, ${pal.a})`, transform: `scaleY(${expOut(seg(local, 0.2, 0.4))})`, transformOrigin: "top" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <div key={k} style={{ height: 10, borderRadius: 5, background: pal.line, width: `${[100, 80, 92, 60, 74][k]}%`, transform: `scaleX(${expOut(seg(local, 0.35 + k * 0.08, 0.3))})`, transformOrigin: "left" }} />
          ))}
          <div style={{ marginTop: 8, height: 70, borderRadius: 10, background: pal.card2, transform: `scale(${spring(local - 0.7, 16, 0.75)})` }} />
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0b0c0e" : "#e9e7e2", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", left: 960, top: 540, width: 0, height: 0, transform: `scale(${zoom}) translate(${-camX}px, ${-camY}px)` }}>
        {Array.from({ length: COLS * ROWS }).map((_, i) => {
          const p = tilePos(i);
          const pop = spring(t - 0.1 - hash(i, 9) * 0.8, 15, 0.75);
          // shuffle: tiles swap to mirrored slots at the end
          const sh = expInOut(seg(t, 6.6 + (i % 4) * 0.05, 0.6));
          const q = tilePos(COLS * ROWS - 1 - i);
          const x = p.x + (q.x - p.x) * sh;
          const y = p.y + (q.y - p.y) * sh;
          const title = tileTitle(i);
          return (
            <div key={i} style={{ position: "absolute", left: x - TW / 2, top: y - TH / 2, width: TW, height: TH, borderRadius: 20, overflow: "hidden", transform: `scale(${pop})`, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
              <Cover i={i} title={title} pal={pal} ff={ff} />
              {i === A && caseA > 0 && <div style={{ position: "absolute", inset: 0, opacity: caseA }}>{casePage(t - 2.0, title)}</div>}
              {i === Bt && caseB > 0 && <div style={{ position: "absolute", inset: 0, opacity: caseB }}>{casePage(t - 4.4, title)}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", inset: 0, background: pal.bg, opacity: dim * 0.82 }} />
      <Svg>
        {nameP > 0 && <Txt text={name} x={960} y={540} size={fit(name, 1400, 200, 900)} weight={900} color={pal.fg} font={ff} p={nameP} tracking={-0.05} />}
        {roleP > 0 && <Txt text={c.role || "Selected work, 2020 to now"} x={960} y={640} size={44} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" />}
      </Svg>
      <Track src="tracks/portfolio-zoom.wav" on={audio} />
    </AbsoluteFill>
  );
}
