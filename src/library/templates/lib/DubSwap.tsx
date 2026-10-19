import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { langs: string; lines: string; tagline: string };

// An AI dubbing promo: a speaker card plays with a live waveform and mouth
// shape; a language dial clicks EN → ES → JA → FR, and with each click the
// subtitle line morphs letter by letter while the waveform re-colours and a
// "same voice" match meter stays pinned high.
export default function DubSwap({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const langs = [...list(c.langs || "EN, ES, JA, FR"), "EN", "EN", "EN", "EN"].slice(0, 4);
  const lines = [...(c.lines || "Welcome to the show. | Bienvenidos al programa. | 番組へようこそ。 | Bienvenue dans l'émission.").split("|").map((s) => s.trim()), "", "", "", ""].slice(0, 4);
  const per = 1.8;
  const start = 0.8;
  const k = Math.min(3, Math.max(0, Math.floor((t - start) / per)));
  const u = t - start - k * per;
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2"];
  const col = cols[k];
  const prev = lines[Math.max(0, k - 1)];
  const cur = lines[k];
  const morph = c01(u / 0.5);
  const shown = k === 0 ? cur.slice(0, Math.floor(c01(u / 0.8) * cur.length)) : Array.from({ length: Math.max(prev.length, cur.length) }, (_, i) => (i / Math.max(prev.length, cur.length) < morph ? cur[i] ?? "" : prev[i] ?? "")).join("");
  const talk = 0.3 + 0.7 * Math.abs(Math.sin(t * 11) * Math.sin(t * 5.3));
  const outro = expInOut(seg(t, start + per * 4 + 0.3, 0.5));
  const endP = c01((t - start - per * 4 - 0.7) / 0.8);
  const match = 96 + Math.round(Math.sin(t * 3) * 1.5);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* speaker card */}
        <div style={{ position: "absolute", left: 140, top: 120, width: 1000, height: 640, borderRadius: 36, overflow: "hidden", background: `linear-gradient(160deg, #2c3550, #6b4e5e)`, transform: `scale(${spring(t - 0.1, 14, 0.7)})` }}>
          <Svg w={1000} h={640}>
            <circle cx={500} cy={260} r={120} fill="#e2b8a0" />
            <path d="M330,640 C330,470 670,470 670,640 Z" fill="#1f2433" />
            <ellipse cx={500} cy={310} rx={34} ry={6 + talk * 20} fill="#5b2a2a" />
            <circle cx={455} cy={240} r={9} fill="#2b1d1d" />
            <circle cx={545} cy={240} r={9} fill="#2b1d1d" />
          </Svg>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center" }}>
            <span style={{ padding: "12px 26px", borderRadius: 14, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 44, fontWeight: 700 }}>{shown || " "}</span>
          </div>
          <div style={{ position: "absolute", left: 30, top: 30, padding: "8px 18px", borderRadius: 10, background: col, color: "#fff", fontFamily: MONO, fontSize: 26, fontWeight: 700 }}>{langs[k]}</div>
        </div>
        {/* waveform */}
        <div style={{ position: "absolute", left: 140, top: 800, width: 1000, height: 150, display: "flex", alignItems: "center", gap: 6 }}>
          {Array.from({ length: 70 }, (_, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 4, background: col, height: 10 + 130 * Math.abs(Math.sin(i * 0.4 + t * 6) * hash(i, Math.floor(t * 8))) * talk }} />
          ))}
        </div>
        {/* language dial */}
        <Svg>
          <g transform="translate(1560 400)">
            <circle r={230} fill={pal.card} />
            {langs.map((l, i) => {
              const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
              return (
                <text key={i} x={Math.cos(a) * 160} y={Math.sin(a) * 160 + 14} textAnchor="middle" fontFamily={MONO} fontSize={40} fontWeight={700} fill={i === k ? cols[i] : pal.muted}>
                  {l}
                </text>
              );
            })}
            <g transform={`rotate(${(k + (u < 0.25 && k > 0 ? -1 + spring(u, 18, 0.5) : 0)) * 90})`}>
              <line x1={0} y1={0} x2={0} y2={-100} stroke={col} strokeWidth={14} strokeLinecap="round" />
            </g>
            <circle r={36} fill={col} />
          </g>
        </Svg>
        <div style={{ position: "absolute", left: 1330, top: 700, width: 460 }}>
          <div style={{ display: "flex", fontSize: 28, color: pal.muted }}>
            <span>Voice match</span>
            <span style={{ marginLeft: "auto", color: pal.fg, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{match}%</span>
          </div>
          <div style={{ height: 16, borderRadius: 8, background: pal.card2, marginTop: 10 }}>
            <div style={{ width: `${match}%`, height: "100%", borderRadius: 8, background: "#2fbf71" }} />
          </div>
          <div style={{ display: "flex", fontSize: 28, color: pal.muted, marginTop: 24 }}>
            <span>Lip sync</span>
            <span style={{ marginLeft: "auto", color: "#2fbf71", fontWeight: 800 }}>on</span>
          </div>
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Your voice, every language." x={960} y={500} size={104} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "AI dubbing"}`} x={960} y={620} size={48} weight={600} color={pal.v} font={ff} p={c01((t - start - per * 4 - 1.1) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/dub-swap.wav" on={audio} />
    </AbsoluteFill>
  );
}
