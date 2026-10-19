import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Track, c01, expInOut, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { left: string; right: string; moves: string; cta: string };

// A pixel card battle: two cards deal in, flip face up, and trade attacks;
// each hit shakes the target, flashes white, pops a damage number and drains
// its HP bar in steps; the final blow shatters the loser's card into pixels.
const KNIGHT = ["...XX...", "..XXXX..", "..X..X..", "..XXXX..", ".XXXXXX.", "X.XXXX.X", "..X..X..", ".XX..XX."];
const SLIME = ["........", "...XX...", "..XXXX..", ".XXXXXX.", "XX.XX.XX", "XXXXXXXX", "XXXXXXXX", ".XXXXXX."];
function Pix({ map, px, color }: { map: string[]; px: number; color: string }) {
  return (
    <svg width={map[0].length * px} height={map.length * px} shapeRendering="crispEdges" style={{ display: "block" }}>
      {map.flatMap((r, j) => r.split("").map((ch, i) => (ch === "X" ? <rect key={`${i}-${j}`} x={i * px} y={j * px} width={px} height={px} fill={color} /> : null)))}
    </svg>
  );
}

export default function PixelDuel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const L = c.left || "Knight";
  const R = c.right || "Slime";
  const moves = [...list(c.moves || "Slash, Bounce, Power strike"), "Attack", "Attack", "Attack"].slice(0, 3);
  // attacks: [time, attacker 0=left 1=right, damage]
  const atk: [number, number, number][] = [
    [2.2, 0, 30],
    [3.6, 1, 20],
    [5.0, 0, 70],
  ];
  const hp = (side: number) => 100 - atk.filter(([at, a]) => a !== side && t > at + 0.25).reduce((s, [, , d]) => s + d, 0);
  const flip = (side: number) => c01((t - 1.0 - side * 0.2) / 0.4);
  const KO = t > 5.25;
  const shatter = c01((t - 5.6) / 1.0);
  const outro = expInOut(seg(t, 7.8, 0.4));
  const endP = c01((t - 8.1) / 0.6);
  const card = (side: number) => {
    const x0 = side ? 1180 : 340;
    const deal = spring(t - 0.2 - side * 0.2, 14, 0.65);
    const myAtk = atk.find(([at, a]) => a === side && t > at && t < at + 0.6);
    const hit = atk.find(([at, a]) => a !== side && t > at + 0.2 && t < at + 0.5);
    const lunge = myAtk ? Math.sin(c01((t - myAtk[0]) / 0.5) * Math.PI) * (side ? -260 : 260) : 0;
    const shake = hit ? (hash(side, Math.floor(t * 40)) - 0.5) * 30 : 0;
    const f = flip(side);
    const sx = Math.abs(Math.cos(f * Math.PI));
    const face = f > 0.5;
    const dead = side === 1 && KO;
    const v = hp(side);
    return (
      <div key={side} style={{ position: "absolute", left: x0 + lunge + shake + (1 - deal) * (side ? 900 : -900), top: 230, width: 400, height: 560 }}>
        {!(dead && shatter > 0) && (
          <div style={{ width: "100%", height: "100%", transform: `scaleX(${sx})`, background: face ? "#f4f4f4" : pal.v, border: "8px solid #1a1c2c", boxShadow: "10px 10px 0 #1a1c2c", boxSizing: "border-box", padding: 20, filter: hit ? "brightness(3)" : "none" }}>
            {face ? (
              <>
                <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, color: "#1a1c2c" }}>{side ? R : L}</div>
                <div style={{ height: 260, margin: "16px 0", background: side ? "#a7f070" : "#3cbcfc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pix map={side ? SLIME : KNIGHT} px={24} color="#1a1c2c" />
                </div>
                <div style={{ fontFamily: MONO, fontSize: 24, color: "#1a1c2c" }}>HP {v}/100</div>
                <div style={{ height: 22, border: "4px solid #1a1c2c", marginTop: 8, display: "flex" }}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} style={{ flex: 1, marginRight: 2, background: i < Math.ceil(v / 10) ? (v > 40 ? "#38b764" : "#ef7d57") : "transparent" }} />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ width: "100%", height: "100%", backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.2) 0 16px, transparent 16px 32px)" }} />
            )}
          </div>
        )}
        {dead &&
          shatter > 0 &&
          Array.from({ length: 70 }, (_, i) => {
            const gx = (i % 7) * 57;
            const gy = Math.floor(i / 7) * 56;
            const a = hash(i, 1) * Math.PI * 2;
            const v2 = 300 + hash(i, 2) * 600;
            return <div key={i} style={{ position: "absolute", left: gx + Math.cos(a) * v2 * shatter, top: gy + Math.sin(a) * v2 * shatter + 900 * shatter * shatter, width: 50, height: 50, background: i % 3 ? "#f4f4f4" : "#a7f070", opacity: 1 - shatter }} />;
          })}
        {/* damage number */}
        {atk.map(([at, a, d], k) =>
          a !== side && t > at + 0.2 && t < at + 1.0 ? (
            <div key={k} style={{ position: "absolute", left: 140, top: 120 - c01((t - at - 0.2) / 0.8) * 140, fontFamily: MONO, fontSize: 90, fontWeight: 900, color: "#ef7d57", WebkitTextStroke: "4px #1a1c2c", opacity: 1 - c01((t - at - 0.7) / 0.3) }}>
              -{d}
            </div>
          ) : null,
        )}
      </div>
    );
  };
  const curMove = atk.reduce((m, [at], i) => (t > at - 0.4 ? i : m), -1);

  return (
    <AbsoluteFill style={{ background: "#5d275d", overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(#ffffff10 2px, transparent 2px), linear-gradient(90deg, #ffffff10 2px, transparent 2px)", backgroundSize: "48px 48px" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {card(0)}
        {card(1)}
        <div style={{ position: "absolute", left: 0, right: 0, top: 40, textAlign: "center", fontFamily: MONO, fontSize: 60, fontWeight: 900, color: "#f4f4f4", letterSpacing: "0.1em" }}>{KO ? "K.O.!" : "VS"}</div>
        {curMove >= 0 && !KO && (
          <div style={{ position: "absolute", left: 560, right: 560, bottom: 90, padding: "22px 30px", border: "6px solid #f4f4f4", background: "#1a1c2c", fontFamily: MONO, fontSize: 38, color: "#f4f4f4", textAlign: "center" }}>
            {(atk[curMove][1] ? R : L).toUpperCase()} USES {moves[curMove].toUpperCase()}!
          </div>
        )}
        {KO && (
          <div style={{ position: "absolute", left: 560, right: 560, bottom: 90, padding: "22px 30px", border: "6px solid #f4f4f4", background: "#1a1c2c", fontFamily: MONO, fontSize: 38, color: "#ffcd75", textAlign: "center" }}>
            {L.toUpperCase()} WINS! +120 XP
          </div>
        )}
      </div>
      {endP > 0 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: MONO }}>
          <div style={{ fontSize: 110, fontWeight: 900, color: "#f4f4f4", textShadow: "8px 8px 0 #1a1c2c", transform: `scale(${spring(t - 8.1, 16, 0.5)})` }}>{nameOf(b).toUpperCase()}</div>
          <div style={{ fontSize: 40, color: "#ffcd75", marginTop: 30, opacity: Math.floor(t * 2.5) % 2 ? 1 : 0.3 }}>{c.cta || "PRESS START"}</div>
        </AbsoluteFill>
      )}
      <Track src="tracks/pixel-duel.wav" on={audio} />
    </AbsoluteFill>
  );
}
