import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { SERIF, Svg, Track, Txt, c01, expInOut, expOut, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { question: string; answer: string };

// A vertical paper cut-out shadow play on a warm backlit screen, puppets on
// sticks and all. A small figure walks through the rain to a house, a window
// lights, the door opens onto a cat and a table where someone waits with two
// steaming cups, and the cut-out text answers what makes a place feel like home.
const W = 1080;
const H = 1920;
const INK = "#120c08";

function Walker({ x, y, s, step, umbrella }: { x: number; y: number; s: number; step: number; umbrella: boolean }) {
  const l1 = Math.sin(step) * 22;
  const l2 = -l1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={INK}>
      <line x1={0} y1={-40} x2={0} y2={420} stroke={INK} strokeWidth={3} opacity={0.6} />
      <circle cx={0} cy={-190} r={34} />
      <path d="M-34,-150 L34,-150 L48,20 L-48,20 Z" />
      <path d={`M-14,18 L${-14 + l1},120 L${-2 + l1},120 L4,18 Z`} />
      <path d={`M4,18 L${14 + l2},120 L${26 + l2},120 L18,18 Z`} />
      {umbrella && (
        <>
          <line x1={30} y1={-120} x2={40} y2={-300} stroke={INK} strokeWidth={6} />
          <path d="M-90,-290 C-60,-380 140,-380 170,-290 C140,-300 110,-292 80,-300 C50,-292 20,-300 -10,-292 C-40,-300 -60,-292 -90,-290 Z" />
        </>
      )}
    </g>
  );
}

export default function ShadowTheatreHome({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const name = nameOf(b);
  const q = c.question || "What makes a place feel like home?";
  const ans = c.answer || "The ones who wait for you inside.";

  const scene2 = t >= 5.6;
  const walkX = lerp(-100, 640, c01((t - 0.6) / 3.6));
  const step = (t - 0.6) * 9;
  const win = expOut(seg(t, 4.3, 0.5));
  const door = expInOut(seg(t, 4.8, 0.6));
  const glow = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 3.1);
  const jitter = (k: number) => Math.sin(t * 11 + k) * 2;
  const qP = c01((t - 0.2) / 0.6) * (1 - c01((t - 3.8) / 0.4));
  const aP = c01((t - 7.6) / 0.7);
  const cut = expInOut(seg(t, 5.3, 0.5));

  return (
    <AbsoluteFill style={{ background: "#2a1609", overflow: "hidden" }}>
      {/* backlit screen */}
      <div style={{ position: "absolute", left: 40, top: 120, width: W - 80, height: H - 240, borderRadius: 12, background: `radial-gradient(ellipse at 50% 45%, #ffd79a ${glow * 10}%, #f0a654 55%, #b5612a 100%)`, boxShadow: "inset 0 0 120px rgba(80,30,0,0.6)" }} />
      <Svg w={W} h={H}>
        <defs>
          <clipPath id="sth-screen">
            <rect x={40} y={120} width={W - 80} height={H - 240} rx={12} />
          </clipPath>
        </defs>
        <g clipPath="url(#sth-screen)">
          {!scene2 && (
            <g opacity={1 - cut}>
              {/* rain */}
              {t < 4.6 &&
                Array.from({ length: 80 }).map((_, i) => {
                  const x = hash(i, 1) * W;
                  const y = (hash(i, 2) * H + t * 1400) % H;
                  return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 46} stroke={INK} strokeWidth={3} opacity={0.35} />;
                })}
              {/* rooftops far */}
              <path d="M40,1300 L160,1200 L260,1300 L260,1230 L380,1150 L480,1240 L480,1300 Z" fill={INK} opacity={0.35} transform={`translate(${jitter(1)} 0)`} />
              {/* the house */}
              <g transform={`translate(${700 + jitter(2)} 1040)`}>
                <path d="M-160,0 L0,-160 L160,0 L160,360 L-160,360 Z" fill={INK} />
                <rect x={-50} y={40} width={100} height={100} fill="#ffe7a8" opacity={win} />
                <path d="M-50,90 L50,90 M0,40 L0,140" stroke={INK} strokeWidth={10} opacity={win} />
                <rect x={60} y={190} width={70} height={170} fill="#ffe7a8" opacity={door} />
                <rect x={60} y={190} width={70 * (1 - door)} height={170} fill={INK} />
                <path d="M100,-120 L100,-170 L130,-170 L130,-90 Z" fill={INK} />
                {t > 4.3 && [0, 1, 2].map((k) => <circle key={k} cx={115 + Math.sin(t * 2 + k) * 10} cy={-190 - ((t * 60 + k * 40) % 120)} r={14 + k * 4} fill={INK} opacity={0.3} />)}
              </g>
              <rect x={40} y={1400} width={W - 80} height={400} fill={INK} />
              {walkX < 640 && <Walker x={walkX} y={1280} s={0.9} step={step} umbrella />}
              {walkX >= 640 && door > 0.5 && <g opacity={1 - c01((t - 5.1) / 0.3)}><Walker x={760} y={1280} s={0.9} step={0} umbrella={false} /></g>}
            </g>
          )}
          {scene2 && (
            <g opacity={c01((t - 5.6) / 0.4)}>
              {/* inside: lamp, table, two figures, a cat */}
              <path d="M540,300 L540,520" stroke={INK} strokeWidth={6} />
              <path d="M440,620 L640,620 L590,520 L490,520 Z" fill={INK} />
              <rect x={180} y={1260} width={720} height={40} fill={INK} transform={`translate(${jitter(3)} 0)`} />
              <rect x={220} y={1300} width={30} height={260} fill={INK} />
              <rect x={830} y={1300} width={30} height={260} fill={INK} />
              <Walker x={330} y={1150} s={1.0} step={0} umbrella={false} />
              <Walker x={760} y={1150} s={1.0} step={0} umbrella={false} />
              {[440, 640].map((x, k) => (
                <g key={k}>
                  <path d={`M${x - 34},1260 L${x - 28},1200 L${x + 28},1200 L${x + 34},1260 Z`} fill={INK} />
                  {[0, 1].map((s) => <path key={s} d={`M${x - 8 + s * 14},1190 q${Math.sin(t * 3 + s + k) * 14},-40 0,-80`} stroke={INK} strokeWidth={6} fill="none" opacity={0.5} />)}
                </g>
              ))}
              <path d={`M520,1060 C480,1000 420,1060 540,1140 C660,1060 600,1000 560,1060 Z`} fill={INK} opacity={c01((t - 6.8) / 0.4)} transform={`translate(0 ${-c01((t - 6.8) / 1.0) * 60})`} />
              {/* cat */}
              <g transform={`translate(${880 + jitter(4)} 1560)`} fill={INK}>
                <ellipse cx={0} cy={0} rx={70} ry={40} />
                <circle cx={60} cy={-40} r={30} />
                <path d="M44,-66 L50,-96 L66,-70 Z M70,-66 L84,-92 L88,-60 Z" />
                <path d={`M-60,0 C-120,${-10 + Math.sin(t * 3) * 20} -110,-80 -80,-90`} stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
              </g>
              <rect x={40} y={1600} width={W - 80} height={200} fill={INK} />
            </g>
          )}
        </g>
        {/* cut-out caption strips */}
        {qP > 0 && (
          <g opacity={qP} transform={`rotate(-2 540 300)`}>
            <rect x={120} y={230} width={840} height={130} fill="#f7ead4" />
            <Txt text={q} x={540} y={315} size={Math.min(56, 780 / Math.max(1, q.length * 0.5))} weight={400} color={INK} font={SERIF} p={1} mode="fade" />
          </g>
        )}
        {aP > 0 && (
          <g opacity={aP} transform={`rotate(1.5 540 300)`}>
            <rect x={100} y={250} width={880} height={140} fill="#f7ead4" />
            <Txt text={ans} x={540} y={340} size={Math.min(56, 820 / Math.max(1, ans.length * 0.5))} weight={400} color={INK} font={SERIF} p={1} mode="fade" italic />
            <Txt text={name} x={540} y={1760} size={48} weight={400} color="#f7ead4" font={SERIF} p={c01((t - 8.2) / 0.6)} mode="fade" />
          </g>
        )}
      </Svg>
      {/* curtain edges */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 70, background: pal.p, opacity: 0.9 }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 70, background: pal.p, opacity: 0.9 }} />
      <Track src="tracks/shadow-theatre-home.wav" on={audio} />
    </AbsoluteFill>
  );
}
