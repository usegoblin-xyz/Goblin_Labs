import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Cursor, MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, kf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { prefix: string; endpoint: string; tagline: string };

// From zero to first call: Create key is clicked, a key generates as a
// scramble that settles, it's copied, a terminal runs a request with it,
// and a 200 response pretty-prints back.
export default function ApiKey({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const prefix = c.prefix || "sk_live_";
  const endpoint = c.endpoint || "https://api.example.com/v1/run";
  const key = prefix + Array.from({ length: 24 }, (_, i) => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(hash(i, 7) * 31)]).join("");
  const gen = c01((t - 1.4) / 1.0);
  const shown = key
    .split("")
    .map((ch, i) => (i / key.length < gen ? ch : "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(hash(i, Math.floor(t * 24)) * 31)]))
    .join("");
  const masked = t > 3.0 ? key.slice(0, prefix.length + 4) + "•".repeat(14) + key.slice(-4) : shown;
  const copied = t > 2.6;
  const cx = kf(t, [[0.4, 1300], [1.1, 1180], [2.2, 1180], [2.5, 1430]], cubicInOut);
  const cy = kf(t, [[0.4, 800], [1.1, 300], [2.2, 300], [2.5, 470]], cubicInOut);
  const press = Math.max(0, 1 - Math.abs(t - 1.2) * 8) + Math.max(0, 1 - Math.abs(t - 2.55) * 8);
  const cmd = `curl ${endpoint} -H "Authorization: Bearer ${key.slice(0, prefix.length + 4)}…"`;
  const cmdT = cmd.slice(0, Math.floor(c01((t - 3.4) / 1.2) * cmd.length));
  const res = c01((t - 4.9) / 0.8);
  const outro = expInOut(seg(t, 7.4, 0.5));
  const endP = c01((t - 7.8) / 0.8);
  const json = ['{', '  "status": "ok",', '  "id": "run_8f2a",', '  "latency_ms": 184', '}'];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* dashboard card */}
        <div style={{ position: "absolute", left: 300, top: 160, width: 1320, height: 400, borderRadius: 30, background: pal.card, padding: 50, boxSizing: "border-box", transform: `translateY(${(1 - spring(t - 0.1, 14, 0.7)) * 120}px) translateY(${-cubicInOut(seg(t, 3.2, 0.6)) * 80}px)` }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 46, fontWeight: 800, color: pal.fg }}>API keys</div>
            <div style={{ marginLeft: "auto", padding: "18px 34px", borderRadius: 40, background: t > 1.2 ? pal.card2 : pal.v, color: t > 1.2 ? pal.fg : pal.onV, fontSize: 28, fontWeight: 700 }}>+ Create key</div>
          </div>
          {t > 1.3 && (
            <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 20, padding: "26px 30px", borderRadius: 20, background: pal.card2, opacity: c01((t - 1.3) * 4) }}>
              <div style={{ fontFamily: MONO, fontSize: 38, color: pal.fg, letterSpacing: "0.02em" }}>{masked}</div>
              <div style={{ marginLeft: "auto", padding: "14px 26px", borderRadius: 30, background: copied ? pal.v : pal.fg, color: copied ? pal.onV : pal.bg, fontSize: 26, fontWeight: 700 }}>{copied ? "Copied ✓" : "Copy"}</div>
            </div>
          )}
        </div>
        {t < 3.0 && <Cursor x={cx} y={cy} press={press} color={pal.fg} size={44} />}
        {/* terminal */}
        {t > 3.2 && (
          <div style={{ position: "absolute", left: 300, top: 560, width: 1320, height: 420, borderRadius: 26, background: pal.dark ? "#0f1013" : "#17181c", padding: 40, boxSizing: "border-box", fontFamily: MONO, fontSize: 28, color: "#e6e6e8", lineHeight: 1.55, opacity: c01((t - 3.2) * 3), transform: `translateY(${(1 - spring(t - 3.2, 15, 0.7)) * 100}px)` }}>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              <span style={{ color: "#8b8b90" }}>$ </span>
              {cmdT}
              {t < 4.7 && "▍"}
            </div>
            {res > 0 && (
              <div style={{ marginTop: 16 }}>
                <span style={{ color: "#2fbf71" }}>HTTP 200</span>
                {json.map((l, i) => (
                  <div key={i} style={{ color: i === 1 || i === 3 ? pal.a : "#e6e6e8", opacity: c01(res * 6 - i) }}>
                    {l}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="First call in a minute." x={960} y={500} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "get your key"}`} x={960} y={620} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 8.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/api-key.wav" on={audio} />
    </AbsoluteFill>
  );
}
