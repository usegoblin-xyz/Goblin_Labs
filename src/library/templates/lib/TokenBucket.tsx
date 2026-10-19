import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expOut, fit, fontOf, lerp, nameOf, palette, useT } from "../../motion";

type C = { tagline: string };

// A token bucket rate limiter explained as a little machine. A tap refills the
// bucket at a steady rate, every request has to take one token to get through
// the gate, a burst drains the bucket and the overflow bounces with a 429,
// and a live chart tallies allowed against rejected. Every frame is replayed
// from t = 0, so any frame can be rendered on its own.
const CAP = 8;
const RATE = 2; // tokens per second
const START = 4;
const ARRIVALS: number[] = [
  1.0, 1.8, 2.6, 3.2,
  ...Array.from({ length: 14 }, (_, i) => 4.0 + i * 0.075),
  5.6, 6.1, 6.6, 7.1, 7.6,
];

type Ev = { at: number; ok: boolean };
const EVENTS: Ev[] = (() => {
  let L = START;
  let last = 0;
  return ARRIVALS.map((at) => {
    L = Math.min(CAP, L + (at - last) * RATE);
    last = at;
    if (L >= 1) {
      L -= 1;
      return { at, ok: true };
    }
    return { at, ok: false };
  });
})();

function level(t: number) {
  let L = START;
  let last = 0;
  for (const e of EVENTS) {
    if (e.at > t) break;
    L = Math.min(CAP, L + (e.at - last) * RATE);
    last = e.at;
    if (e.ok) L -= 1;
  }
  return Math.min(CAP, L + (t - last) * RATE);
}

const CAPTIONS: [number, string][] = [
  [0.0, "A tap refills the bucket at a steady rate"],
  [1.0, "Every request spends one token to pass"],
  [3.9, "A burst arrives and drains the bucket"],
  [4.6, "No token left: 429 Too Many Requests"],
  [5.6, "Bursts are absorbed, the average rate is capped"],
];

export default function TokenBucket({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const OK = "#2fbf71";
  const BAD = "#ff4d5e";
  const L = level(t);
  const full = Math.floor(L + 1e-6);
  const frac = L - full;
  const endP = c01((t - 8.4) / 0.6);
  const cap = [...CAPTIONS].reverse().find(([at]) => t >= at)![1];
  const capAt = [...CAPTIONS].reverse().find(([at]) => t >= at)![0];

  // geometry
  const BX = 420;
  const BY = 370;
  const BW = 280;
  const BH = 320;
  const LANE = 820;
  const GATE = BX + BW / 2;
  const SERVER = 1080;
  const slot = (i: number) => [BX + 80 + (i % 2) * 120, BY + BH - 52 - Math.floor(i / 2) * 76] as const;

  const bins = Array.from({ length: 16 }, (_, k) => {
    const lo = k * 0.5;
    const ev = EVENTS.filter((e) => e.at >= lo && e.at < lo + 0.5 && e.at <= t);
    return { ok: ev.filter((e) => e.ok).length, bad: ev.filter((e) => !e.ok).length };
  });
  const okN = EVENTS.filter((e) => e.ok && e.at <= t).length;
  const badN = EVENTS.filter((e) => !e.ok && e.at <= t).length;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g opacity={1 - c01(endP * 3)}>
          <text x={120} y={130} fontFamily={ff} fontSize={58} fontWeight={900} fill={pal.fg} letterSpacing={-1.5}>
            Token bucket
          </text>
          <text x={120} y={186} fontFamily={ff} fontSize={30} fill={pal.muted} opacity={c01((t - capAt) / 0.3)}>
            {cap}
          </text>

          {/* tap */}
          <path d={`M${GATE - 160},${BY - 110} L${GATE - 10},${BY - 110} Q${GATE + 10},${BY - 110} ${GATE + 10},${BY - 90} L${GATE + 10},${BY - 60}`} fill="none" stroke={pal.muted} strokeWidth={22} strokeLinecap="round" />
          <circle cx={GATE + 10} cy={BY - 60 + frac * 120} r={22 * (0.4 + frac * 0.6)} fill={pal.a} opacity={L < CAP - 0.01 ? 0.5 + frac * 0.5 : 0} />

          {/* bucket */}
          <path d={`M${BX},${BY} L${BX + 20},${BY + BH} L${BX + BW - 20},${BY + BH} L${BX + BW},${BY}`} fill={pal.card} stroke={pal.fg} strokeWidth={6} strokeLinejoin="round" />
          {Array.from({ length: CAP }).map((_, i) => {
            const [x, y] = slot(i);
            const on = i < full;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={30} fill="none" stroke={pal.line} strokeWidth={3} strokeDasharray="5 6" />
                {on && (
                  <>
                    <circle cx={x} cy={y} r={30} fill={pal.a} />
                    <circle cx={x} cy={y} r={20} fill="none" stroke={pal.onA} strokeWidth={3} opacity={0.5} />
                  </>
                )}
              </g>
            );
          })}
          <text x={BX + BW + 30} y={BY + 40} fontFamily={ff} fontSize={24} fill={pal.muted}>
            capacity {CAP}
          </text>
          {/* gate */}
          <rect x={GATE - 40} y={BY + BH + 4} width={80} height={LANE - BY - BH - 40} rx={10} fill={pal.line} />

          {/* lane */}
          <line x1={0} y1={LANE} x2={SERVER - 40} y2={LANE} stroke={pal.line} strokeWidth={4} strokeDasharray="14 12" />
          <g transform={`translate(${SERVER} ${LANE - 90})`}>
            <rect width={170} height={180} rx={20} fill={pal.card} stroke={pal.line} strokeWidth={3} />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={24} y={28 + k * 44} width={122} height={28} rx={8} fill={pal.line} />
            ))}
            <text x={85} y={220} textAnchor="middle" fontFamily={ff} fontSize={24} fill={pal.muted}>
              API
            </text>
          </g>

          {/* requests */}
          {EVENTS.map((e, i) => {
            const d = t - e.at;
            if (d < -0.9 || d > 0.9) return null;
            let x: number;
            let op = 1;
            let col = pal.p;
            if (d < 0) x = lerp(-60, GATE, (d + 0.9) / 0.9);
            else if (e.ok) {
              x = lerp(GATE, SERVER + 20, expOut(c01(d / 0.6)));
              op = 1 - c01((d - 0.55) / 0.25);
              col = OK;
            } else {
              x = GATE - expOut(c01(d / 0.5)) * 240;
              op = 1 - c01((d - 0.4) / 0.4);
              col = BAD;
            }
            const y = LANE - (e.ok || d < 0 ? 0 : Math.sin(c01(d / 0.5) * Math.PI) * 90);
            return (
              <g key={i} transform={`translate(${x} ${y})`} opacity={op}>
                <rect x={-34} y={-24} width={68} height={48} rx={12} fill={col} />
                <text x={0} y={9} textAnchor="middle" fontFamily={ff} fontSize={22} fontWeight={800} fill="#fff">
                  {d >= 0 && !e.ok ? "429" : "req"}
                </text>
                {/* token handed over at the gate */}
                {e.ok && d >= 0 && d < 0.25 && <circle cx={0} cy={-120 * (1 - d / 0.25) - 30} r={18} fill={pal.a} />}
              </g>
            );
          })}

          {/* readouts */}
          <g transform="translate(1340 230)">
            <text x={0} y={0} fontFamily={ff} fontSize={24} fill={pal.muted}>
              Tokens
            </text>
            <text x={0} y={64} fontFamily={ff} fontSize={64} fontWeight={900} fill={pal.fg}>
              {L.toFixed(1)}
            </text>
            <text x={200} y={0} fontFamily={ff} fontSize={24} fill={pal.muted}>
              Refill rate
            </text>
            {/* stacked fraction */}
            <text x={250} y={44} textAnchor="middle" fontFamily={ff} fontSize={30} fontWeight={800} fill={pal.fg}>
              2 tokens
            </text>
            <line x1={190} y1={58} x2={310} y2={58} stroke={pal.fg} strokeWidth={3} />
            <text x={250} y={92} textAnchor="middle" fontFamily={ff} fontSize={30} fontWeight={800} fill={pal.fg}>
              second
            </text>
            <text x={380} y={0} fontFamily={ff} fontSize={24} fill={pal.muted}>
              Burst
            </text>
            <text x={380} y={64} fontFamily={ff} fontSize={64} fontWeight={900} fill={pal.fg}>
              {CAP}
            </text>
          </g>

          {/* chart */}
          <g transform="translate(1340 420)">
            <rect x={-20} y={-20} width={540} height={400} rx={24} fill={pal.card} />
            <text x={10} y={22} fontFamily={ff} fontSize={24} fontWeight={700} fill={pal.fg}>
              Requests per half second
            </text>
            <text x={10} y={60} fontFamily={ff} fontSize={22} fill={OK}>{`● ${okN} allowed`}</text>
            <text x={220} y={60} fontFamily={ff} fontSize={22} fill={BAD}>{`● ${badN} rejected`}</text>
            <line x1={10} y1={330} x2={490} y2={330} stroke={pal.line} strokeWidth={2} />
            {bins.map((bn, k) => {
              const x = 14 + k * 30;
              const hOk = bn.ok * 26;
              const hBad = bn.bad * 26;
              return (
                <g key={k}>
                  <rect x={x} y={330 - hOk} width={22} height={hOk} rx={4} fill={OK} />
                  <rect x={x} y={330 - hOk - hBad} width={22} height={hBad} rx={4} fill={BAD} />
                </g>
              );
            })}
            <line x1={14 + (t / 0.5) * 30} y1={90} x2={14 + (t / 0.5) * 30} y2={330} stroke={pal.p} strokeWidth={2} opacity={t < 8 ? 0.6 : 0} />
          </g>
        </g>
        {endP > 0 && (
          <>
            <Txt text={name} x={960} y={520} size={fit(name, 1300, 180, 900)} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.05} />
            <Txt text={c.tagline || "Bursts welcome, floods refused"} x={960} y={630} size={46} weight={500} color={pal.muted} font={ff} p={c01((t - 8.8) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/token-bucket.wav" on={audio} />
    </AbsoluteFill>
  );
}
