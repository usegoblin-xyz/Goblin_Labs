import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Paint, SERIF, Svg, Track, Txt, c01, expInOut, expOut, fontOf, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { title: string };

// A sketchbook page: a pencil draws a cat, a bird and a snail, watercolour
// washes bloom behind them, then they come alive. The cat blinks and swishes
// its tail, the bird flaps and flies off the page, the snail slides along on
// a shiny trail, and the page flips to the title.
const PENCIL = "#3d3a36";

const CAT = {
  body: "M-80,120 C-110,40 -90,-40 -30,-60 C10,-70 50,-50 60,0 C70,50 60,100 40,120 Z",
  head: "M10,-70 C-20,-80 -30,-130 0,-150 C30,-160 72,-140 72,-105 C72,-80 45,-65 10,-70 Z",
  ears: "M3,-146 L10,-182 L30,-155 M47,-152 L68,-176 L68,-136",
  legs: "M-30,120 L-30,60 M10,120 L12,70",
  whisk: "M70,-100 L104,-108 M70,-94 L106,-92 M-2,-100 L-34,-108",
};
const BIRD = {
  body: "M-60,0 C-40,-40 40,-40 60,-10 L92,-6 L60,6 C40,40 -40,40 -60,0 Z",
  tail: "M-60,0 L-98,-18 L-92,12 Z",
  legs: "M-10,30 L-14,62 M14,30 L12,62",
};
function spiral(r0: number, turns: number) {
  const pts: string[] = [];
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * turns * Math.PI * 2;
    const r = r0 * (1 - i / n) + 4;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
}
const SNAIL_BODY = "M-110,52 C-90,30 30,34 80,40 C96,24 104,6 100,-8 C112,-6 118,10 112,30 C108,44 96,54 80,56 Z";

export default function SketchbookCritters({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const d = (a: number, dur: number) => expInOut(seg(t, a, dur));
  const wash = (i: number) => expOut(seg(t, 4.2 + i * 0.2, 0.7));
  const alive = t > 5.0;

  // cat
  const blink = [5.6, 7.1].some((bt) => t > bt && t < bt + 0.14);
  const tail = alive ? Math.sin((t - 5) * 4) * 22 : 0;
  const headTilt = alive ? Math.sin((t - 5) * 1.6) * 6 : 0;
  // bird
  const flap = alive ? Math.sin((t - 5) * 26) : 0;
  const takeoff = expInOut(seg(t, 6.0, 1.0));
  const bx = 1010 + takeoff * 900;
  const by = 400 - takeoff * 520 + Math.sin(t * 8) * 6 * takeoff;
  // snail
  const sx = 1330 + c01((t - 5.0) / 3.0) * 160;
  const turn = expInOut(seg(t, 8.0, 0.9));
  const titleP = c01((t - 8.5) / 0.6);

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#2b2622" : "#d9d2c5", overflow: "hidden", fontFamily: ff }}>
      {/* title page under the turning page */}
      <div style={{ position: "absolute", left: 160, top: 90, width: 1600, height: 930, borderRadius: 18, background: "#f7f1e3", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
        <Svg w={1600} h={930}>
          {titleP > 0 && (
            <>
              <Txt text={c.title || "Sketchbook"} x={800} y={470} size={170} weight={400} color={PENCIL} font={SERIF} p={titleP} mode="fade" italic tracking={-0.01} />
              <Paint d="M560,520 C700,545 900,505 1040,530" color={pal.p} width={10} p={c01((t - 8.9) / 0.5)} />
              <Txt text={`by ${name}`} x={800} y={610} size={48} weight={400} color={PENCIL} font={SERIF} p={c01((t - 9.1) / 0.5)} mode="fade" italic />
            </>
          )}
        </Svg>
      </div>
      {/* the drawing page, which flips up at the end */}
      <div style={{ position: "absolute", inset: 0, perspective: 2600 }}>
        <div style={{ position: "absolute", left: 160, top: 90, width: 1600, height: 930, transformOrigin: "50% 0", transform: `rotateX(${turn * 178}deg)`, backfaceVisibility: "hidden", borderRadius: 18, background: "#fbf7ee", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.35, backgroundImage: "radial-gradient(rgba(120,100,70,0.25) 1px, transparent 1px)", backgroundSize: "6px 6px" }} />
          <Svg w={1600} h={930}>
            <g transform="translate(-160 -90)">
              {/* washes */}
              <ellipse cx={520} cy={530} rx={170} ry={150} fill={pal.p} opacity={0.22 * wash(0)} style={{ filter: "blur(8px)" }} />
              <ellipse cx={bx} cy={by} rx={110} ry={70} fill={pal.a} opacity={0.3 * wash(1) * (1 - takeoff)} style={{ filter: "blur(8px)" }} />
              <ellipse cx={sx} cy={690} rx={140} ry={80} fill="#f2b45a" opacity={0.28 * wash(2)} style={{ filter: "blur(8px)" }} />
              {/* cat */}
              <g transform="translate(520 560)">
                <Paint d={CAT.body} color={PENCIL} width={5} p={d(0.4, 0.5)} />
                <g transform={`rotate(${headTilt} 20 -70)`}>
                  <Paint d={CAT.head} color={PENCIL} width={5} p={d(0.8, 0.4)} />
                  <Paint d={CAT.ears} color={PENCIL} width={5} p={d(1.1, 0.25)} />
                  {t > 1.4 && (blink ? <path d="M18,-112 l14,0 M44,-112 l14,0" stroke={PENCIL} strokeWidth={4} /> : <><circle cx={25} cy={-112} r={5} fill={PENCIL} /><circle cx={51} cy={-112} r={5} fill={PENCIL} /></>)}
                  <Paint d={CAT.whisk} color={PENCIL} width={3} p={d(1.4, 0.25)} />
                </g>
                <Paint d={CAT.legs} color={PENCIL} width={5} p={d(1.55, 0.2)} />
                <g transform={`rotate(${tail} -80 110)`}>
                  <Paint d="M-80,110 C-150,100 -160,40 -120,20" color={PENCIL} width={5} p={d(1.6, 0.25)} />
                </g>
              </g>
              {/* bird */}
              <g transform={`translate(${bx} ${by})`}>
                <Paint d={BIRD.body} color={PENCIL} width={5} p={d(1.9, 0.5)} />
                <Paint d={BIRD.tail} color={PENCIL} width={5} p={d(2.35, 0.2)} />
                <g transform={`translate(0 -14) scale(1 ${1 - flap * 0.9}) translate(0 14)`}>
                  <Paint d="M-24,-12 C-4,-70 40,-66 30,-12" color={PENCIL} width={5} p={d(2.5, 0.3)} />
                </g>
                {t > 2.6 && <circle cx={34} cy={-14} r={5} fill={PENCIL} />}
                {takeoff < 0.1 && <Paint d={BIRD.legs} color={PENCIL} width={4} p={d(2.7, 0.2)} />}
              </g>
              {/* snail */}
              <Paint d={`M1240,748 L${sx - 90},748`} color="#b9c8d6" width={10} p={c01((t - 5.0) / 0.3)} opacity={0.7} />
              <g transform={`translate(${sx} 690)`}>
                <Paint d={SNAIL_BODY} color={PENCIL} width={5} p={d(3.0, 0.5)} />
                <g transform="translate(-20 -10)">
                  <Paint d={spiral(62, 2.6)} color={PENCIL} width={5} p={d(3.4, 0.6)} />
                </g>
                <Paint d={`M100,-8 C${104 + Math.sin(t * 5) * 6},-40 ${96 + Math.sin(t * 5) * 8},-56 ${92 + Math.sin(t * 5) * 8},-62`} color={PENCIL} width={4} p={d(4.0, 0.2)} />
                <Paint d={`M108,-4 C${120 + Math.cos(t * 5) * 6},-34 ${122 + Math.cos(t * 5) * 8},-50 ${124 + Math.cos(t * 5) * 8},-56`} color={PENCIL} width={4} p={d(4.05, 0.2)} />
              </g>
              {/* pencil */}
              {t < 4.3 && (() => {
                const tgt = t < 1.8 ? [520 + Math.sin(t * 9) * 60, 520 + Math.cos(t * 7) * 80] : t < 3.0 ? [1010 + Math.sin(t * 10) * 60, 400 + Math.cos(t * 8) * 30] : [1330 + Math.sin(t * 9) * 70, 680 + Math.cos(t * 8) * 40];
                return (
                  <g transform={`translate(${tgt[0]} ${tgt[1]}) rotate(35)`} opacity={c01((4.3 - t) * 4)}>
                    <rect x={-10} y={-220} width={20} height={190} fill="#f2c94c" />
                    <path d="M-10,-30 L10,-30 L0,0 Z" fill="#e8c9a0" />
                    <path d="M-3,-9 L3,-9 L0,0 Z" fill={PENCIL} />
                    <rect x={-10} y={-240} width={20} height={22} fill="#e57373" />
                  </g>
                );
              })()}
            </g>
          </Svg>
          {/* spiral binding */}
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", top: -14, left: 60 + i * 68, width: 22, height: 40, borderRadius: 12, border: "4px solid #8a8580", borderBottom: "none" }} />
          ))}
          <div style={{ position: "absolute", right: 40, bottom: 30, fontFamily: SERIF, fontStyle: "italic", fontSize: 30, color: "#9a8f7c" }}>{`p. ${12 + Math.floor(hash(1, 1) * 3)}`}</div>
        </div>
      </div>
      <Track src="tracks/sketchbook-critters.wav" on={audio} />
    </AbsoluteFill>
  );
}
