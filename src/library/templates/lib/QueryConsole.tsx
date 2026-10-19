import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { words: string; version: string; tagline: string };

// A database client launch: a connection string types and connects, the
// schema tree unfolds, a query types with autocomplete, runs in 12 ms and the
// rows stream in before flipping into a chart. Three words slam, then the
// version lands under your name.
const TABLES = [
  { name: "users", cols: ["id", "email", "plan", "created_at"] },
  { name: "orders", cols: ["id", "user_id", "total", "status"] },
  { name: "events", cols: ["id", "kind", "ts"] },
  { name: "invoices", cols: ["id", "amount"] },
];
const SQL = [
  ["SELECT ", "plan", ", count(*) AS ", "users"],
  ["FROM ", "users u"],
  ["JOIN ", "orders", " o ON o.user_id = u.id"],
  ["GROUP BY ", "plan", " ORDER BY 2 DESC;"],
];
const ROWS = [
  ["Pro", "4,812"],
  ["Team", "2,330"],
  ["Free", "1,904"],
  ["Enterprise", "611"],
];

export default function QueryConsole({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const words = [...list(c.words || "Fast, Typed, Local-first"), "Fast", "Fast", "Fast"].slice(0, 3);
  const conn = "postgres://prod.example.com:5432/app";

  const connTyped = Math.floor(c01((t - 0.2) / 0.55) * conn.length);
  const connected = spring(t - 0.85, 18, 0.7);
  const winIn = expOut(seg(t, 0.9, 0.5));
  const sqlFlat = SQL.map((l) => l.join("")).join("\n");
  const sqlChars = Math.floor(c01((t - 2.1) / 1.7) * sqlFlat.length);
  const auto = t > 2.85 && t < 3.25;
  const run = t > 3.95 && t < 4.08;
  const rows = (i: number) => expOut(seg(t, 4.15 + i * 0.12, 0.3));
  const chart = expInOut(seg(t, 5.4, 0.6));
  const slamOut = expInOut(seg(t, 6.6, 0.25));
  const endP = c01((t - 8.1) / 0.6);

  // SQL typed so far, line by line, with colour for keywords.
  let left = sqlChars;
  const lines = SQL.map((parts) => {
    const out: { s: string; kw: boolean; id: boolean }[] = [];
    for (const [k, p] of parts.entries()) {
      if (left <= 0) break;
      const take = p.slice(0, left);
      left -= p.length;
      out.push({ s: take, kw: k === 0, id: k === 1 || k === 3 });
    }
    left -= 1;
    return out;
  });

  return (
    <AbsoluteFill style={{ background: "#08090b", overflow: "hidden", fontFamily: ff }}>
      {/* connection line */}
      <div style={{ position: "absolute", left: 0, right: 0, top: lerp(500, 70, winIn), display: "flex", justifyContent: "center", alignItems: "center", gap: 22, fontFamily: MONO, fontSize: lerp(40, 24, winIn), color: "rgba(255,255,255,0.75)", opacity: 1 - slamOut }}>
        {conn.slice(0, connTyped)}
        {connected > 0.01 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 99, background: "rgba(40,200,100,0.14)", color: "#3ddc84", fontFamily: ff, fontSize: lerp(28, 20, winIn), fontWeight: 700, transform: `scale(${connected})` }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: "#3ddc84", boxShadow: "0 0 12px #3ddc84" }} /> Connected
          </span>
        )}
      </div>

      {/* app window */}
      {winIn > 0 && slamOut < 1 && (
        <div style={{ position: "absolute", left: 160, top: 130, width: 1600, height: 860, borderRadius: 22, background: "#101216", border: "1.5px solid rgba(255,255,255,0.08)", overflow: "hidden", opacity: winIn * (1 - slamOut), transform: `translateY(${(1 - winIn) * 60}px) scale(${1 - slamOut * 0.06})` }}>
          {/* schema */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 360, background: "#0c0d10", borderRight: "1.5px solid rgba(255,255,255,0.06)", padding: "26px 24px", fontFamily: MONO, fontSize: 22 }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, letterSpacing: "0.1em", marginBottom: 18 }}>SCHEMA · public</div>
            {TABLES.map((tb, i) => {
              const o = expOut(seg(t, 1.1 + i * 0.16, 0.35));
              const open = i < 2 ? expInOut(seg(t, 1.4 + i * 0.2, 0.4)) : 0;
              return (
                <div key={tb.name} style={{ opacity: o, transform: `translateX(${(1 - o) * -30}px)`, marginBottom: 12 }}>
                  <div style={{ color: "#fff" }}>
                    <span style={{ color: pal.p, display: "inline-block", transform: `rotate(${open * 90}deg)`, width: 22 }}>›</span> {tb.name}
                  </div>
                  <div style={{ height: open * tb.cols.length * 34, overflow: "hidden", paddingLeft: 36 }}>
                    {tb.cols.map((col) => (
                      <div key={col} style={{ color: "rgba(255,255,255,0.5)", height: 34 }}>
                        {col}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {/* editor */}
          <div style={{ position: "absolute", left: 360, right: 0, top: 0, height: 330, padding: "30px 40px", fontFamily: MONO, fontSize: 30, lineHeight: "52px", borderBottom: "1.5px solid rgba(255,255,255,0.06)" }}>
            {lines.map((l, i) => (
              <div key={i} style={{ whiteSpace: "pre", height: 52 }}>
                <span style={{ color: "rgba(255,255,255,0.25)", marginRight: 26 }}>{i + 1}</span>
                {l.map((p, k) => (
                  <span key={k} style={{ color: p.kw ? "#c792ea" : p.id ? pal.a : "rgba(255,255,255,0.88)" }}>
                    {p.s}
                  </span>
                ))}
              </div>
            ))}
            {auto && (
              <div style={{ position: "absolute", left: 280, top: 168, width: 300, borderRadius: 12, background: "#1b1e24", border: "1.5px solid rgba(255,255,255,0.1)", fontSize: 24, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
                {["orders", "order_items", "organizations"].map((s, i) => (
                  <div key={s} style={{ padding: "10px 18px", background: i === 0 ? `${pal.p}33` : "transparent", color: i === 0 ? "#fff" : "rgba(255,255,255,0.6)" }}>
                    {s}
                  </div>
                ))}
              </div>
            )}
            <div style={{ position: "absolute", right: 36, top: 26, padding: "12px 26px", borderRadius: 12, background: pal.p, color: pal.onP, fontFamily: ff, fontSize: 24, fontWeight: 800, transform: `scale(${run ? 0.9 : 1})` }}>Run ⌘↵</div>
          </div>
          {/* results */}
          <div style={{ position: "absolute", left: 360, right: 0, top: 330, bottom: 0, padding: "26px 40px" }}>
            {t > 4.1 && (
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18, fontSize: 22, color: "rgba(255,255,255,0.55)" }}>
                <span style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(61,220,132,0.14)", color: "#3ddc84", fontWeight: 700 }}>12 ms</span>4 rows
                <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  {["Table", "Chart"].map((v, i) => (
                    <span key={v} style={{ padding: "6px 16px", borderRadius: 8, background: (i === 1) === (chart > 0.5) ? "rgba(255,255,255,0.12)" : "transparent", color: "#fff" }}>
                      {v}
                    </span>
                  ))}
                </span>
              </div>
            )}
            <Svg w={1240} h={420} style={{ top: 80, left: 40 }}>
              {ROWS.map((r, i) => {
                const p = rows(i);
                const y = 20 + i * 70;
                const val = parseInt(r[1].replace(",", ""), 10);
                const bw = (val / 4812) * 760;
                return (
                  <g key={i} opacity={p}>
                    <rect x={0} y={y} width={1160} height={60} rx={8} fill={i % 2 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)"} opacity={1 - chart} />
                    <text x={20} y={y + 40} fontFamily={MONO} fontSize={26} fill="#fff">
                      {r[0]}
                    </text>
                    <rect x={260} y={y + 12} width={lerp(0, bw, chart)} height={36} rx={8} fill={i === 0 ? pal.p : pal.a} opacity={chart} />
                    <text x={lerp(600, 280 + bw, chart)} y={y + 40} fontFamily={MONO} fontSize={26} fill={chart > 0.5 ? "#fff" : "rgba(255,255,255,0.8)"}>
                      {r[1]}
                    </text>
                  </g>
                );
              })}
            </Svg>
          </div>
        </div>
      )}

      {/* word slams */}
      <Svg>
        {words.map((w, i) => {
          const a = 6.75 + i * 0.45;
          const s = spring(t - a, 20, 0.6);
          const gone = t > a + 0.45 && i < 2;
          if (t < a || gone || t > 8.0) return null;
          return (
            <g key={i} transform={`translate(960 500) scale(${lerp(1.5, 1, s)}) translate(-960 -500)`} opacity={c01(s * 3)}>
              <Txt text={w} x={960} y={600} size={fit(w, 1500, 300, 900)} weight={900} color={i === 1 ? pal.p : "#fff"} font={ff} p={1} tracking={-0.05} mode="fade" stagger={0} />
            </g>
          );
        })}
        {endP > 0 && (
          <>
            <Txt text={name} x={960} y={520} size={fit(name, 1400, 200, 900)} weight={900} color="#fff" font={ff} p={endP} tracking={-0.05} />
            <Txt text={`${c.version || "v1.0"} is out · ${c.tagline || "the database client you'll actually enjoy"}`} x={960} y={640} size={40} weight={500} color={pal.a} font={ff} p={c01((t - 8.5) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/query-console.wav" on={audio} />
    </AbsoluteFill>
  );
}
