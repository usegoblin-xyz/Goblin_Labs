import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { SERIF, Svg, Track, Txt, c01, expInOut, expOut, hash, lerp, mix, nameOf, seg, useT } from "../../motion";

type C = { title: string };

// A silent short with no dialogue, where the sound carries half the story.
// A storm hits a dark lighthouse. Inside, the old keeper dozes by the stove
// until a ship's horn sounds somewhere out in the dark. We never see the
// ship yet; we hear it, and watch him hear it. Footsteps up the spiral
// stairs, a match, the lamp roars alight, the beam finds a small ship
// turning away from the rocks, two blasts of thanks, and dawn.
const SKY_NIGHT = "#1b2a44";
const SEA_NIGHT = "#13233a";

function Tower({ x, y, s, lamp }: { x: number; y: number; s: number; lamp: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-60,0 L-40,-360 L40,-360 L60,0 Z" fill="#05070c" />
      <rect x={-52} y={-420} width={104} height={60} fill="#05070c" />
      <rect x={-40} y={-410} width={80} height={44} fill={mix("#1a2030", "#ffe7a1", lamp)} />
      <path d="M-56,-420 L0,-470 L56,-420 Z" fill="#05070c" />
      {lamp > 0 && <circle cx={0} cy={-388} r={80 * lamp} fill="#ffe7a1" opacity={0.35 * lamp} />}
    </g>
  );
}

export default function LighthouseKeeper({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const name = nameOf(b);
  const scene = t < 1.6 ? 0 : t < 3.0 ? 1 : t < 4.6 ? 2 : t < 5.6 ? 3 : 4;
  const flash = Math.max(Math.exp(-Math.pow((t - 0.8) / 0.05, 2)), 0.6 * Math.exp(-Math.pow((t - 0.95) / 0.04, 2)));
  const dawn = expInOut(seg(t, 7.6, 1.4));
  const lamp = t < 5.0 ? 0 : expOut(seg(t, 5.0, 0.5));
  const wave = (x: number, k: number, amp: number) => Math.sin(x / 90 + t * (2.2 + k * 0.4) + k) * amp + Math.sin(x / 37 - t * 3 + k) * amp * 0.3;
  const storm = 1 - dawn;

  const exterior = (lampOn: number) => {
    const sky = mix(SKY_NIGHT, "#f2b880", dawn * 0.85);
    const sea = mix(SEA_NIGHT, "#4b6a86", dawn * 0.8);
    const beamA = (t - 5.6) * 1.6;
    return (
      <g>
        <rect width={1920} height={1080} fill={sky} />
        {dawn > 0 && <circle cx={1500} cy={760 - dawn * 160} r={90} fill="#ffd9a0" opacity={dawn} />}
        <rect width={1920} height={1080} fill="#ffffff" opacity={flash * 0.7} />
        {/* beam */}
        {lampOn > 0 && (
          <g opacity={lampOn * (1 - dawn * 0.7)}>
            <path d={`M640,336 L${640 + Math.cos(beamA) * 2400},${336 + Math.sin(beamA) * 140 - 180} L${640 + Math.cos(beamA + 0.08) * 2400},${336 + Math.sin(beamA + 0.08) * 140 + 180} Z`} fill="#ffe7a1" opacity={0.5 * Math.max(0.15, Math.cos(beamA))} />
          </g>
        )}
        {/* ship lights far out */}
        {t > 5.6 && (
          <g transform={`translate(${lerp(1500, 1700, c01((t - 5.6) / 3))} ${lerp(760, 745, c01((t - 5.6) / 3))}) scale(1.6)`} opacity={1 - dawn * 0.5}>
            <path d="M-50,0 L50,0 L36,16 L-36,16 Z" fill={dawn > 0.3 ? "#1a2230" : "#05070c"} />
            <rect x={-6} y={-40} width={6} height={40} fill="#05070c" />
            <circle cx={-3} cy={-44} r={5} fill={t % 0.6 < 0.3 ? "#ff4d4d" : "#ffd7a0"} />
            <circle cx={30} cy={-6} r={4} fill="#ffe7a1" />
          </g>
        )}
        {/* sea */}
        {[0, 1, 2].map((k) => {
          const base = 780 + k * 90;
          let d = `M0,1080 L0,${base}`;
          for (let x = 0; x <= 1920; x += 40) d += ` L${x},${base + wave(x, k, (34 - k * 6) * (0.3 + storm * 0.7))}`;
          d += " L1920,1080 Z";
          return <path key={k} d={d} fill={mix(sea, "#000000", k * 0.25)} />;
        })}
        {/* rock and tower */}
        <path d="M440,1080 L470,840 L560,800 L700,810 L800,860 L840,1080 Z" fill="#05070c" />
        <Tower x={640} y={860} s={1.35} lamp={lampOn} />
        {/* rain */}
        {storm > 0.05 &&
          Array.from({ length: 120 }).map((_, i) => {
            const x = (hash(i, 1) * 2100 + t * 300) % 2100 - 100;
            const y = (hash(i, 2) * 1080 + t * 1500) % 1080;
            return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 40} stroke="#9fb3cc" strokeWidth={2} opacity={0.35 * storm} />;
          })}
        {/* gulls at dawn */}
        {dawn > 0.3 &&
          [0, 1, 2].map((i) => {
            const gx = 1000 + i * 140 + (t - 8) * 80;
            const gy = 300 + i * 40 + Math.sin(t * 3 + i) * 10;
            const f = Math.sin(t * 8 + i) * 10;
            return <path key={i} d={`M${gx - 30},${gy - f} Q${gx - 14},${gy - 14} ${gx},${gy} Q${gx + 14},${gy - 14} ${gx + 30},${gy - f}`} stroke="#2a2230" strokeWidth={4} fill="none" opacity={dawn} />;
          })}
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Svg>
        {scene === 0 && exterior(0)}

        {scene === 1 && (() => {
          // interior: keeper dozing by the stove, head lifts at the horn
          const lift = expOut(seg(t, 2.15, 0.4));
          const fire = 0.8 + 0.2 * Math.sin(t * 17) * Math.sin(t * 7);
          return (
            <g>
              <rect width={1920} height={1080} fill="#140d08" />
              <circle cx={1300} cy={760} r={420} fill="#ff9a3c" opacity={0.18 * fire} />
              {/* stove */}
              <rect x={1200} y={620} width={200} height={260} rx={10} fill="#050505" />
              <rect x={1240} y={720} width={120} height={70} rx={6} fill="#ff9a3c" opacity={fire} />
              <rect x={1270} y={300} width={50} height={320} fill="#050505" />
              {/* window with rain */}
              <rect x={300} y={240} width={300} height={360} fill="#0c1220" stroke="#050505" strokeWidth={16} />
              {/* chair and keeper */}
              <g transform="translate(880 880)" fill="#050505">
                <rect x={-120} y={-260} width={30} height={260} />
                <rect x={-120} y={-110} width={220} height={30} />
                <rect x={70} y={-90} width={24} height={90} />
                <path d="M-90,-110 L-60,-300 L40,-300 L60,-110 Z" />
                <path d="M40,-130 L160,-130 L170,0 L140,0 L132,-100 L40,-100 Z" />
                <g transform={`rotate(${lerp(38, 0, lift)} -10 -300)`}>
                  <circle cx={-10} cy={-350} r={46} />
                  <path d="M-58,-370 L44,-370 L30,-400 L-40,-400 Z" />
                </g>
              </g>
              {lift > 0.5 && <circle cx={890} cy={520} r={6} fill="#ffe7a1" opacity={(lift - 0.5) * 2} />}
            </g>
          );
        })()}

        {scene === 2 && (() => {
          // spiral stairs; the keeper climbs with a lantern
          const k = c01((t - 3.0) / 1.6);
          const step = Math.floor(k * 14);
          const kx = 600 + Math.sin(step * 0.9) * 260;
          const ky = 900 - step * 40;
          return (
            <g>
              <rect width={1920} height={1080} fill="#0b0a0c" />
              {Array.from({ length: 16 }).map((_, i) => {
                const x = 600 + Math.sin(i * 0.9) * 260;
                const y = 960 - i * 40;
                return <path key={i} d={`M${960},${y + 10} L${x - 90},${y} L${x + 90},${y} Z`} fill="#2c2833" stroke="#000" strokeWidth={2} />;
              })}
              <rect x={940} y={0} width={40} height={1080} fill="#050505" />
              <circle cx={kx + 40} cy={ky - 120} r={260} fill="#ffcf7a" opacity={0.25} />
              <g transform={`translate(${kx} ${ky})`} fill="#050505">
                <path d="M-30,-170 L30,-170 L36,-40 L-36,-40 Z" />
                <circle cx={0} cy={-200} r={28} />
                <path d={`M-22,-40 L${-28 + (step % 2) * 14},10 M22,-40 L${28 - (step % 2) * 14},10`} stroke="#050505" strokeWidth={18} />
                <circle cx={44} cy={-110} r={12} fill="#ffcf7a" />
              </g>
            </g>
          );
        })()}

        {scene === 3 && (() => {
          // lamp room: match strike and ignition
          const match = t > 4.8;
          const ign = expOut(seg(t, 5.0, 0.4));
          return (
            <g>
              <rect width={1920} height={1080} fill={mix("#08090d", "#3a2a10", ign)} />
              {/* lens */}
              {Array.from({ length: 9 }).map((_, i) => (
                <rect key={i} x={760} y={300 + i * 52} width={400} height={40} rx={20} fill={mix("#1a1f2a", "#ffe7a1", ign * (1 - Math.abs(i - 4) / 6))} />
              ))}
              <circle cx={960} cy={510} r={60 + ign * 300} fill="#ffe7a1" opacity={ign * 0.5} />
              {match && ign < 1 && (
                <g transform="translate(1100 700)">
                  <line x1={0} y1={0} x2={-80} y2={-60} stroke="#c9a46a" strokeWidth={6} />
                  <circle cx={-82} cy={-64} r={14 + Math.sin(t * 40) * 3} fill="#ffb347" />
                </g>
              )}
              <path d="M1160,1080 L1150,760 L1230,700 L1280,720 L1320,1080 Z" fill="#050505" />
            </g>
          );
        })()}

        {scene === 4 && exterior(lamp)}

        {/* title at dawn */}
        {t > 8.2 && (
          <>
            <Txt text={c.title || "The Keeper"} x={1220} y={300} size={110} weight={400} color="#2a1c18" font={SERIF} p={c01((t - 8.2) / 0.7)} mode="fade" italic tracking={-0.01} />
            <Txt text={`a silent short by ${name}`} x={1220} y={370} size={34} weight={400} color="#3c2a24" font={SERIF} p={c01((t - 8.7) / 0.6)} mode="fade" italic />
          </>
        )}
        {/* letterbox */}
        <rect x={0} y={0} width={1920} height={70} fill="#000" />
        <rect x={0} y={1010} width={1920} height={70} fill="#000" />
      </Svg>
      <Track src="tracks/lighthouse-keeper.wav" on={audio} />
    </AbsoluteFill>
  );
}
