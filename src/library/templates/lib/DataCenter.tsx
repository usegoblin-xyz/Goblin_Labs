import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, kf, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; stops: string; outro: string };

// Inside an AI data centre, as an isometric tour: power comes in, rows of
// GPU racks blink, a cooling loop circulates, the network spine carries
// packets, and the camera glides from stop to stop with a label each.
const ISO = (x: number, y: number, z: number) => ({ x: 960 + (x - y) * 0.866 * 1, y: 300 + (x + y) * 0.5 - z });

function Box3({ x, y, z, w, d, h, top, left, right }: { x: number; y: number; z: number; w: number; d: number; h: number; top: string; left: string; right: string }) {
  const P = (a: number, b: number, c: number) => ISO(x + a, y + b, z + c);
  const pts = (arr: { x: number; y: number }[]) => arr.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <g>
      <polygon points={pts([P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)])} fill={left} />
      <polygon points={pts([P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)])} fill={right} />
      <polygon points={pts([P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)])} fill={top} />
    </g>
  );
}

export default function DataCenter({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const stops = [...list(c.stops || "Power in, GPU racks, Cooling loop, Network spine"), "Stop", "Stop", "Stop", "Stop"].slice(0, 4);
  const cool = "#38a3ff";
  // camera: pan + zoom between stops
  const camX = kf(t, [[1.6, 0], [2.6, -380], [4.4, -380], [5.4, 60], [7.2, 60], [8.2, 380], [10.0, 380], [10.8, 0]], cubicInOut);
  const camY = kf(t, [[1.6, 0], [2.6, -60], [4.4, -60], [5.4, 40], [7.2, 40], [8.2, -120], [10.0, -120], [10.8, 0]], cubicInOut);
  const camS = kf(t, [[0.4, 0.8], [1.6, 1.0], [2.6, 1.5], [10.0, 1.5], [10.8, 0.9]], cubicInOut);
  const label = t < 1.6 ? -1 : t < 5.0 ? 0 : t < 7.8 ? 1 : t < 10.0 ? 2 : 3;
  const outro = expInOut(seg(t, 11.4, 0.5));
  const endP = c01((t - 11.8) / 0.8);
  const rackTop = mix(pal.card2, pal.fg, 0.08);
  const rackL = pal.card;
  const rackR = mix(pal.card, "#000", 0.25);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro, transformOrigin: "960px 540px", transform: `scale(${camS}) translate(${camX}px, ${camY}px)` }}>
        <Svg>
          {/* floor */}
          <polygon points={[ISO(-300, -300, 0), ISO(700, -300, 0), ISO(700, 700, 0), ISO(-300, 700, 0)].map((p) => `${p.x},${p.y}`).join(" ")} fill={pal.card} opacity={0.6} />
          {/* power: substation block with a bolt line */}
          <Box3 x={-280} y={-260} z={0} w={140} d={120} h={120} top={pal.a} left={mix(pal.a, "#000", 0.3)} right={mix(pal.a, "#000", 0.5)} />
          {(() => {
            const a = ISO(-210, -140, 60);
            const z = ISO(-40, 40, 60);
            const p = c01((t - 1.0) / 1.0);
            return <line x1={a.x} y1={a.y} x2={lerp(a.x, z.x, p)} y2={lerp(a.y, z.y, p)} stroke={pal.a} strokeWidth={6} strokeDasharray="14 10" strokeDashoffset={-t * 60} />;
          })()}
          {/* racks: 3 rows × 6 */}
          {Array.from({ length: 18 }, (_, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const x = 0 + col * 90;
            const y = 0 + row * 170;
            const pop = spring(t - 0.3 - i * 0.04, 18, 0.7);
            return (
              <g key={i} transform={`translate(0 ${(1 - pop) * 200})`} opacity={c01(pop * 2)}>
                <Box3 x={x} y={y} z={0} w={70} d={110} h={170} top={rackTop} left={rackL} right={rackR} />
                {Array.from({ length: 6 }, (_, k) => {
                  const p = ISO(x + 10 + (k % 3) * 20, y + 110, 30 + Math.floor(k / 3) * 60);
                  const on = Math.sin(t * (6 + hash(i, k) * 8) + hash(i, k + 3) * 10) > 0.2;
                  return <circle key={k} cx={p.x} cy={p.y} r={3.5} fill={on ? pal.v : pal.faint} />;
                })}
              </g>
            );
          })}
          {/* cooling loop */}
          {(() => {
            const loop = [ISO(-60, -60, 4), ISO(560, -60, 4), ISO(560, 470, 4), ISO(-60, 470, 4)];
            const d = "M" + loop.map((p) => `${p.x},${p.y}`).join(" L") + " Z";
            const on = t > 6.4;
            return <path d={d} fill="none" stroke={on ? cool : pal.line} strokeWidth={10} strokeDasharray="22 14" strokeDashoffset={on ? -t * 120 : 0} opacity={0.9} />;
          })()}
          {/* network spine */}
          {(() => {
            const a = ISO(250, -120, 260);
            const z = ISO(250, 480, 260);
            return (
              <g>
                <line x1={a.x} y1={a.y} x2={z.x} y2={z.y} stroke={pal.fg} strokeWidth={6} opacity={0.5} />
                {t > 8.6 &&
                  Array.from({ length: 8 }, (_, k) => {
                    const u = ((t - 8.6) * 0.8 + k / 8) % 1;
                    return <circle key={k} cx={lerp(a.x, z.x, u)} cy={lerp(a.y, z.y, u)} r={9} fill={pal.v} />;
                  })}
                {[0, 1, 2].map((row) => {
                  const p = ISO(250, row * 170 + 50, 260);
                  const q = ISO(250, row * 170 + 50, 170);
                  return <line key={row} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={pal.fg} strokeWidth={3} opacity={0.4} />;
                })}
              </g>
            );
          })()}
        </Svg>
      </div>
      {/* labels stay screen-fixed */}
      <Svg>
        <Txt text={c.title || "Inside an AI data centre"} x={960} y={990} size={72} weight={800} color={pal.fg} font={ff} p={c01((t - 0.2) / 0.6)} out={c01((t - 1.5) / 0.3)} />
        {label >= 0 && t < 11.4 && (
          <g key={label}>
            <rect x={110} y={880} width={110} height={110} rx={28} fill={pal.v} />
            <text x={165} y={955} textAnchor="middle" fontFamily={ff} fontSize={58} fontWeight={900} fill={pal.onV}>
              {label + 1}
            </text>
            <Txt text={stops[label]} x={260} y={958} size={70} weight={800} color={pal.fg} font={ff} anchor="start" p={c01((t - [1.6, 5.0, 7.8, 10.0][label]) / 0.5)} tracking={-0.03} />
          </g>
        )}
        {endP > 0 && (
          <>
            <Txt text={c.outro || "Where intelligence gets its power."} x={960} y={520} size={86} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
            <Txt text={nameOf(b)} x={960} y={640} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 12.2) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/data-center.wav" on={audio} />
    </AbsoluteFill>
  );
}

