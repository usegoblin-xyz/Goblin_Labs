import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, kf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { name: string; roles: string; years: string; next: string };

// A career told as a metro map: a coloured line runs station to station
// (each a role with its year), a train dot travels along it with the camera
// tracking, side branches show skills picked up, and the line ends at an
// open station labelled with what's next.
export default function CareerMetro({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = c.name || nameOf(b);
  const roles = [...list(c.roles || "Intern at a studio, Junior designer, Product designer, Design lead"), "Role", "Role", "Role", "Role"].slice(0, 4);
  const years = [...list(c.years || "2016, 2018, 2020, 2023"), "", "", "", ""].slice(0, 4);
  const stations = [
    [300, 700],
    [800, 420],
    [1400, 640],
    [2000, 380],
    [2600, 560],
  ];
  const segLen = stations.slice(1).map((s, i) => Math.hypot(s[0] - stations[i][0], s[1] - stations[i][1]));
  const total = segLen.reduce((a, b2) => a + b2, 0);
  const travel = kf(t, [[0.8, 0], [1.8, 1], [2.4, 1], [3.4, 2], [4.0, 2], [5.0, 3], [5.6, 3], [6.6, 4]], cubicInOut);
  const si = Math.min(3, Math.floor(travel));
  const fr = travel - si;
  const train = [stations[si][0] + (stations[si + 1][0] - stations[si][0]) * fr, stations[si][1] + (stations[si + 1][1] - stations[si][1]) * fr];
  const drawn = stations.slice(1).reduce((acc, _, i) => acc + segLen[i] * c01(travel - i), 0) / total;
  const camX = Math.max(0, Math.min(train[0] - 900, 2600 - 1500));
  const outro = expInOut(seg(t, 8.4, 0.5));
  const branches = ["Figma", "Research", "Systems", "Leading"];
  const lineD = `M${stations.map((s) => s.join(",")).join(" L")}`;

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0e0f12" : "#f6f5f1", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg w={3000}>
          <g transform={`translate(${-camX} 0)`}>
            {/* faint grid */}
            {Array.from({ length: 30 }, (_, i) => (
              <line key={i} x1={i * 100} x2={i * 100} y1={0} y2={1080} stroke={pal.line} strokeWidth={1} opacity={0.4} />
            ))}
            <path d={lineD} fill="none" stroke={pal.faint} strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" />
            <path d={lineD} fill="none" stroke={pal.v} strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${drawn} 2`} />
            {stations.slice(0, 4).map((s, i) => {
              const reached = travel >= i - 0.02;
              const br = cubicInOut(c01((travel - i - 0.1) / 0.6));
              return (
                <g key={i}>
                  {/* skill branch */}
                  <path d={`M${s[0]},${s[1]} l80,${i % 2 ? 120 : -120} h120`} fill="none" stroke={pal.a} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${br} 2`} />
                  {br > 0.9 && (
                    <text x={s[0] + 220} y={s[1] + (i % 2 ? 130 : -110)} fontFamily={ff} fontSize={28} fontWeight={600} fill={pal.muted}>
                      + {branches[i]}
                    </text>
                  )}
                  <circle cx={s[0]} cy={s[1]} r={34} fill={pal.bg} stroke={reached ? pal.v : pal.faint} strokeWidth={10} transform={`translate(${s[0]} ${s[1]}) scale(${reached ? 1 + 0.2 * Math.max(0, 1 - Math.abs(travel - i) * 4) : 1}) translate(${-s[0]} ${-s[1]})`} />
                  <text x={s[0]} y={s[1] + (i % 2 ? -70 : 90)} textAnchor="middle" fontFamily={ff} fontSize={44} fontWeight={800} fill={pal.fg} opacity={reached ? 1 : 0.25}>
                    {roles[i]}
                  </text>
                  <text x={s[0]} y={s[1] + (i % 2 ? -120 : 135)} textAnchor="middle" fontFamily={ff} fontSize={30} fontWeight={600} fill={pal.v} opacity={reached ? 1 : 0.25}>
                    {years[i]}
                  </text>
                </g>
              );
            })}
            {/* next station: open ring */}
            <g transform={`translate(${stations[4][0]} ${stations[4][1]}) scale(${spring(t - 6.6, 14, 0.5)})`}>
              <circle r={50} fill="none" stroke={pal.v} strokeWidth={10} strokeDasharray="12 10" transform={`rotate(${t * 40})`} />
              <text y={110} textAnchor="middle" fontFamily={ff} fontSize={48} fontWeight={900} fill={pal.fg}>
                {c.next || "What's next?"}
              </text>
            </g>
            <circle cx={train[0]} cy={train[1]} r={22} fill={pal.fg} />
            <circle cx={train[0]} cy={train[1]} r={40} fill={pal.fg} opacity={0.15} />
          </g>
        </Svg>
        <div style={{ position: "absolute", left: 80, top: 60, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: pal.v, color: pal.onV, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900 }}>{name[0]}</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: pal.fg }}>{name} · career line</div>
        </div>
      </div>
      {outro > 0 && (
        <Svg>
          <Txt text={name} x={960} y={520} size={140} weight={900} color={pal.fg} font={ff} p={c01((t - 8.8) / 0.6)} tracking={-0.04} />
          <Txt text={c.next || "What's next?"} x={960} y={630} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.1) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/career-metro.wav" on={audio} />
    </AbsoluteFill>
  );
}
