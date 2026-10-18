import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import type { TemplateProps } from "../../kit";
import { Track, alpha, c01, cubicInOut, expOut, fontOf, hash, kf, lerp, mix, nameOf, palette, seg, sineInOut, useT, fit } from "../../motion";

type C = { pitch: string; prompt: string; verb: string; settings: string; outro: string };

// Square launch film for a generative model: a white canvas, one typeface,
// glass controls over a pastel aura, images changing on 16th notes and a
// caption pill typed word by word as each line "lands".
const S = 1080;
const BPM = 128;
const S16 = 60 / BPM / 4;
const ART = ["rhino", "wave", "globe", "tulip", "shell", "egret", "butterfly", "head-apollo", "hand-hold", "head-athena", "palm-tree", "eye", "skeleton", "wave-sketch", "head-herakles", "hand-two"];
const INK = new Set(["rhino", "wave", "globe", "tulip", "shell", "egret", "butterfly", "palm-tree", "eye", "skeleton", "wave-sketch"]);

function Art({ n, tint, style }: { n: string; tint: string; style?: CSSProperties }) {
  const ink = INK.has(n);
  return (
    <div style={{ position: "absolute", inset: 0, background: tint, overflow: "hidden", ...style }}>
      <Img src={staticFile(`editorial-ad/${n}.webp`)} style={{ position: "absolute", inset: ink ? "6%" : "4% 4% 0", width: ink ? "88%" : "92%", height: ink ? "88%" : "96%", objectFit: "contain", objectPosition: "50% 100%", mixBlendMode: ink ? "multiply" : "normal" }} />
    </div>
  );
}

const glass = (dark: boolean): CSSProperties => ({
  background: dark ? "rgba(30,30,34,0.42)" : "rgba(255,255,255,0.42)",
  backdropFilter: "blur(22px) saturate(1.5)",
  WebkitBackdropFilter: "blur(22px) saturate(1.5)",
  boxShadow: `inset 0 1.5px 0 rgba(255,255,255,${dark ? 0.25 : 0.95}), inset 0 0 0 1.5px rgba(255,255,255,${dark ? 0.12 : 0.6}), 0 18px 50px rgba(20,20,40,0.16)`,
});

function Caption({ t, lines, ff, pal }: { t: number; lines: [number, number, string][]; ff: string; pal: ReturnType<typeof palette> }) {
  const cur = [...lines].reverse().find(([a]) => t >= a);
  if (!cur) return null;
  const [a, b, text] = cur;
  const words = text.split(" ");
  const per = Math.min(0.22, (b - a - 0.4) / words.length);
  const o = Math.min(expOut(seg(t, a, 0.3)), 1 - seg(t, b - 0.25, 0.25));
  return (
    <div style={{ position: "absolute", left: "50%", bottom: 56, transform: "translateX(-50%)", padding: "16px 26px", borderRadius: 99, ...glass(pal.dark), opacity: o, fontFamily: ff, fontSize: 30, fontWeight: 600, color: pal.fg, whiteSpace: "nowrap" }}>
      {words.map((w, i) => {
        const e = expOut(seg(t, a + 0.1 + i * per, 0.3));
        const emph = w.startsWith("*");
        return (
          <span key={i} style={{ display: "inline-block", marginRight: "0.28em", opacity: e, transform: `translateY(${(1 - e) * 8}px)`, ...(emph ? { backgroundImage: `linear-gradient(90deg, ${pal.v}, ${pal.a})`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", filter: `drop-shadow(0 0 10px ${alpha(pal.p, 0.35)})` } : {}) }}>
            {emph ? w.slice(1) : w}
          </span>
        );
      })}
    </div>
  );
}

export default function ModelLaunchSquare({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const verb = c.verb || "Create";
  const tints = [mix(pal.v, "#ffffff", 0.78), mix(pal.a, "#ffffff", 0.7), "#f1ede6", "#e9eef5", mix(pal.v, "#ffffff", 0.6), "#f4e9ee"];
  const settings = (c.settings || "Lighting, Mood, Detail").split(",").map((x) => x.trim()).slice(0, 3);
  const scene = t < 2.4 ? 0 : t < 4.8 ? 1 : t < 7.4 ? 2 : t < 9.8 ? 3 : t < 12.4 ? 4 : t < 14.4 ? 5 : 6;
  const starts = [0, 2.4, 4.8, 7.4, 9.8, 12.4, 14.4];
  const push = 1 + 0.04 * sineInOut(seg(t, starts[scene], (starts[scene + 1] ?? 16) - starts[scene]));
  const tick = (t0: number) => Math.floor(Math.max(0, t - t0) / S16);
  const aura = `radial-gradient(circle at ${50 + 20 * Math.sin(t * 0.5)}% ${45 + 15 * Math.cos(t * 0.4)}%, ${alpha(pal.v, 0.32)}, transparent 55%), radial-gradient(circle at ${40 - 18 * Math.cos(t * 0.6)}% ${70 + 10 * Math.sin(t * 0.3)}%, ${alpha(pal.a, 0.32)}, transparent 50%)`;

  const lines: [number, number, string][] = [
    [0.2, 2.3, `This is ${name}.`],
    [2.5, 4.7, c.pitch || "An image model made for taste."],
    [4.9, 7.3, `${verb} in *any style.`],
    [7.5, 9.7, "Give it a reference, and it just understands."],
    [9.9, 12.3, `Adjust its ${settings.join(", its ").toLowerCase()}.`],
    [12.5, 14.3, "Every image, exactly as you pictured it."],
  ];

  const fade = (a: number, d = 0.35) => expOut(seg(t, a, d));
  let body: ReactNode = null;

  if (scene === 0) {
    const drift = t * 18;
    body = (
      <>
        {Array.from({ length: 10 }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2 + 0.3;
          const r = 300 + hash(i, 3) * 140 + drift;
          const x = S / 2 + Math.cos(ang) * r;
          const y = S / 2 + Math.sin(ang) * r * 0.9;
          const sz = 150 + hash(i, 7) * 90;
          return (
            <div key={i} style={{ position: "absolute", left: x - sz / 2, top: y - sz / 2, width: sz, height: sz * 1.2, borderRadius: 18, overflow: "hidden", opacity: fade(0.05 + i * 0.05, 0.5) * (1 - seg(t, 1.9, 0.4)), transform: `rotate(${(hash(i, 9) - 0.5) * 10}deg)` }}>
              <Art n={ART[i]} tint={tints[i % tints.length]} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: S / 2 - 110, textAlign: "center", fontFamily: ff, fontSize: fit(name, 900, 190), fontWeight: 700, letterSpacing: "-0.05em", color: pal.fg }}>
          {name.split("").map((ch, i) => (
            <span key={i} style={{ opacity: fade(0.3 + i * 0.07, 0.3), display: "inline-block", transform: `translateY(${(1 - fade(0.3 + i * 0.07, 0.4)) * 20}px)` }}>{ch}</span>
          ))}
        </div>
      </>
    );
  } else if (scene === 1) {
    const typed = (c.prompt || "a quiet harbour at dawn, ink on paper").slice(0, Math.floor(c01((t - 2.9) / 1.3) * 60));
    const k = tick(2.6);
    body = (
      <>
        <div style={{ position: "absolute", left: 160, top: 120, width: 760, height: 620, borderRadius: 32, overflow: "hidden", opacity: fade(2.4, 0.4) }}>
          <Art n={ART[(k % 8) + 2]} tint={tints[k % tints.length]} />
        </div>
        <div style={{ position: "absolute", left: 110, top: 690, width: 860, height: 96, borderRadius: 48, ...glass(pal.dark), display: "flex", alignItems: "center", padding: "0 30px", gap: 16, fontFamily: ff, fontSize: 30, color: pal.fg, opacity: fade(2.5) }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: pal.p }} />
          <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{typed}<span style={{ opacity: Math.floor(t * 3) % 2 }}>|</span></span>
          <span style={{ width: 56, height: 56, borderRadius: 28, background: pal.fg, color: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>↑</span>
        </div>
      </>
    );
  } else if (scene === 2) {
    const k = tick(4.8);
    body = (
      <div style={{ position: "absolute", left: 90, top: 90, width: 900, height: 760, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 14 }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const on = k > i * 0.8;
          const n = ART[(i * 5 + Math.floor(k / 2)) % ART.length];
          return (
            <div key={i} style={{ position: "relative", borderRadius: 18, overflow: "hidden", opacity: on ? 1 : 0, transform: `scale(${on ? 1 : 0.9})` }}>
              <Art n={n} tint={tints[(i + Math.floor(k / 3)) % tints.length]} />
            </div>
          );
        })}
      </div>
    );
  } else if (scene === 3) {
    const arrow = cubicInOut(seg(t, 8.1, 0.6));
    const k = tick(8.6);
    body = (
      <>
        <div style={{ position: "absolute", left: 90, top: 250, width: 330, height: 420, borderRadius: 26, overflow: "hidden", opacity: fade(7.4), boxShadow: `0 0 0 3px ${pal.fg}` }}>
          <Art n="tulip" tint="#f1ede6" />
          <div style={{ position: "absolute", left: 16, top: 16, padding: "6px 14px", borderRadius: 99, ...glass(false), fontFamily: ff, fontSize: 20, fontWeight: 600, color: "#111" }}>Reference</div>
        </div>
        <svg width={S} height={S} style={{ position: "absolute", inset: 0 }}>
          <path d="M440 460 C 500 420, 540 420, 590 460" stroke={pal.fg} strokeWidth={5} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${arrow} 2`} />
        </svg>
        {[0, 1, 2, 3].map((i) => {
          const e = fade(8.6 + i * S16 * 2, 0.4);
          return (
            <div key={i} style={{ position: "absolute", left: 620 + (i % 2) * 200, top: 260 + Math.floor(i / 2) * 210, width: 185, height: 195, borderRadius: 18, overflow: "hidden", opacity: e, transform: `translateY(${(1 - e) * 20}px)` }}>
              <Art n={["tulip", "butterfly", "shell", "egret"][(i + k) % 4]} tint={tints[i + 1]} />
            </div>
          );
        })}
      </>
    );
  } else if (scene === 4) {
    const vals = settings.map((_, i) => kf(t, [[10.0 + i * 0.5, 0.25 + i * 0.1], [10.8 + i * 0.5, 0.8 - i * 0.15]], cubicInOut));
    body = (
      <>
        <div style={{ position: "absolute", left: 120, top: 120, width: 840, height: 700, borderRadius: 32, overflow: "hidden", opacity: fade(9.8) }}>
          <div style={{ position: "absolute", inset: 0, filter: `brightness(${0.8 + vals[0] * 0.4}) saturate(${0.6 + vals[1] * 1.2}) contrast(${0.9 + (vals[2] ?? 0.5) * 0.4})` }}>
            <Art n="wave" tint={mix(pal.p, "#ffffff", 0.7)} />
          </div>
        </div>
        <div style={{ position: "absolute", right: 70, top: 470, width: 420, padding: 28, borderRadius: 30, ...glass(pal.dark), opacity: fade(10.0), fontFamily: ff }}>
          {settings.map((s, i) => (
            <div key={s} style={{ marginTop: i ? 22 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 600, color: pal.fg }}><span>{s}</span><span style={{ color: pal.muted }}>{Math.round(vals[i] * 100)}</span></div>
              <div style={{ position: "relative", marginTop: 10, height: 10, borderRadius: 5, background: alpha(pal.fg, 0.12) }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${vals[i] * 100}%`, borderRadius: 5, background: `linear-gradient(90deg, ${pal.p}, ${pal.a})` }} />
                <div style={{ position: "absolute", left: `calc(${vals[i] * 100}% - 13px)`, top: -8, width: 26, height: 26, borderRadius: 13, background: "#fff", boxShadow: "0 3px 10px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  } else if (scene === 5) {
    body = (
      <div style={{ position: "absolute", left: 70, top: 110, width: 940, height: 760, display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 14 }}>
        {["head-apollo", "rhino", "shell", "egret", "hand-hold"].map((n, i) => (
          <div key={n} style={{ position: "relative", borderRadius: 22, overflow: "hidden", gridRow: i === 0 ? "span 2" : undefined, opacity: fade(12.4 + i * S16 * 2, 0.4) }}>
            <Art n={n} tint={tints[i]} />
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div style={{ position: "absolute", left: 0, right: 0, top: S / 2 - 130, textAlign: "center", fontFamily: ff }}>
        <div style={{ fontSize: fit(name, 900, 200), fontWeight: 700, letterSpacing: "-0.05em", color: pal.fg, opacity: fade(14.45, 0.5), transform: `scale(${lerp(0.96, 1, fade(14.45, 0.8))})` }}>{name}</div>
        <div style={{ fontSize: 40, fontWeight: 600, marginTop: 6, color: pal.muted, opacity: fade(14.9, 0.4) }}>{c.outro || "Out now"}</div>
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ background: pal.dark ? pal.bg : "#ffffff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: aura, filter: "blur(30px)" }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})` }}>{body}</div>
      <Caption t={t} lines={lines} ff={ff} pal={pal} />
      <Track src="tracks/model-launch-square.wav" on={audio} />
    </AbsoluteFill>
  );
}
