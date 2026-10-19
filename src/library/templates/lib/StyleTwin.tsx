import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { styles: string; tagline: string };

// An AI photo-style app ad: a simple illustrated selfie drops onto the
// canvas, a scan line passes over it, and a 3×2 grid of twins generates one
// by one, each the same face redrawn in a different style (flat, line art,
// pop, duotone, pixel, sketch); one is picked and pops full-screen.
function Face({ style, s, pal }: { style: number; s: number; pal: ReturnType<typeof palette> }) {
  const skin = ["#e9b99a", "#fff", "#ffd23f", pal.v, "#e9b99a", "#f4efe6"][style];
  const ink = ["#2b1d14", "#111", "#111", "#fff", "#2b1d14", "#555"][style];
  const bg = ["#b8d8ff", "#fff", "#ff4f8b", "#111", "#7fd1b9", "#f4efe6"][style];
  const hair = ["#3a2a20", "none", "#111", "#fff", "#3a2a20", "none"][style];
  const sw = style === 1 || style === 5 ? 6 : 0;
  const pix = style === 4;
  return (
    <svg width={s} height={s} viewBox="0 0 200 200" shapeRendering={pix ? "crispEdges" : undefined}>
      <rect width={200} height={200} fill={bg} />
      {style === 2 && Array.from({ length: 100 }, (_, i) => <circle key={i} cx={(i % 10) * 20 + 10} cy={Math.floor(i / 10) * 20 + 10} r={4} fill="#ffffff55" />)}
      {pix ? (
        <g>
          {Array.from({ length: 10 }, (_, j) =>
            Array.from({ length: 10 }, (_, i) => {
              const d = Math.hypot(i - 4.5, j - 4.8);
              if (d > 4.2) return null;
              return <rect key={`${i}${j}`} x={50 + i * 10} y={45 + j * 11} width={10} height={11} fill={j < 3 ? hair : skin} />;
            }),
          )}
          <rect x={80} y={95} width={10} height={10} fill={ink} />
          <rect x={110} y={95} width={10} height={10} fill={ink} />
          <rect x={90} y={125} width={20} height={6} fill={ink} />
        </g>
      ) : (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M40,200 C40,150 160,150 160,200 Z" fill={style === 1 || style === 5 ? "none" : ink} opacity={style === 3 ? 1 : 0.85} stroke={ink} strokeWidth={sw} />
          <ellipse cx={100} cy={95} rx={48} ry={58} fill={style === 1 || style === 5 ? "none" : skin} stroke={ink} strokeWidth={sw || 3} />
          {hair !== "none" && <path d="M52,85 C52,30 148,30 148,85 C130,60 80,60 52,85 Z" fill={hair} />}
          {style === 5 && Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${60 + i * 10},${150 - hash(i) * 10} l20,-30`} stroke={ink} strokeWidth={2} opacity={0.5} />)}
          <circle cx={82} cy={98} r={5} fill={ink} />
          <circle cx={118} cy={98} r={5} fill={ink} />
          <path d="M84,124 Q100,136 116,124" fill="none" stroke={ink} strokeWidth={4} />
        </g>
      )}
    </svg>
  );
}

export default function StyleTwin({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const styles = [...list(c.styles || "Flat, Line art, Pop, Duotone, Pixel, Sketch"), "Style", "Style", "Style", "Style", "Style", "Style"].slice(0, 6);
  const drop = spring(t - 0.2, 13, 0.6);
  const scan = c01((t - 1.0) / 0.9);
  const toGrid = expInOut(seg(t, 1.9, 0.6));
  const genAt = (i: number) => 2.5 + i * 0.4;
  const pick = 2;
  const zoom = expInOut(seg(t, 5.6, 0.7));
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const S = 300;
  const gx = (i: number) => 960 - 1.5 * (S + 30) + (i % 3) * (S + 30) + 15;
  const gy = (i: number) => 220 + Math.floor(i / 3) * (S + 80);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* original selfie */}
        {toGrid < 1 && (
          <div style={{ position: "absolute", left: 960 - 220, top: 120 + (1 - drop) * -900, width: 440, height: 440, borderRadius: 30, overflow: "hidden", opacity: 1 - toGrid, transform: `scale(${1 - toGrid * 0.4})`, boxShadow: "0 30px 60px rgba(0,0,0,0.3)" }}>
            <Face style={0} s={440} pal={pal} />
            {scan > 0 && scan < 1 && <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: pal.v, boxShadow: `0 0 30px 10px ${pal.v}` }} />}
          </div>
        )}
        {toGrid < 0.5 && (
          <Svg>
            <Txt text="Upload one selfie." x={960} y={680} size={60} weight={800} color={pal.fg} font={ff} p={c01((t - 0.5) / 0.4)} />
          </Svg>
        )}
        {/* grid */}
        {toGrid > 0 &&
          styles.map((st, i) => {
            const g = spring(t - genAt(i), 16, 0.6);
            const isPick = i === pick;
            const z = isPick ? zoom : 0;
            const x = gx(i) + (960 - S / 2 - gx(i)) * z;
            const y = gy(i) + (540 - S / 2 - 40 - gy(i)) * z;
            const sc = 1 + z * 1.6;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, width: S, transform: `scale(${g * sc})`, opacity: isPick ? 1 : 1 - zoom, zIndex: isPick ? 5 : 1 }}>
                <div style={{ width: S, height: S, borderRadius: 24, overflow: "hidden", boxShadow: isPick && t > 5.2 ? `0 0 0 6px ${pal.v}` : "0 14px 30px rgba(0,0,0,0.2)", filter: t < genAt(i) + 0.25 ? `blur(${(1 - c01((t - genAt(i)) / 0.25)) * 14}px)` : "none" }}>
                  <Face style={i} s={S} pal={pal} />
                </div>
                <div style={{ textAlign: "center", fontSize: 26, fontWeight: 700, color: pal.fg, marginTop: 10, opacity: 1 - z }}>{st}</div>
              </div>
            );
          })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="One selfie. Every you." x={960} y={500} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "AI portraits in any style"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/style-twin.wav" on={audio} />
    </AbsoluteFill>
  );
}
