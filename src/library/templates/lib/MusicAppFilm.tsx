import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, mix, nameOf, palette, seg, spring, useT, type Pal } from "../../motion";

type C = { track: string; artist: string; lyrics: string; tagline: string };

// A music app film: generated album covers sweep past in a 3D carousel, one
// opens into a now-playing phone with a live waveform, the lyric lines
// highlight in time, then playlists fan out and the name lands on the beat.
function Cover({ k, pal, size }: { k: number; pal: Pal; size: number }) {
  const a = [pal.v, pal.a, "#ff6b6b", "#ffd166", "#06d6a0", "#118ab2", "#8338ec", "#ff8fab"][k % 8];
  const bgc = mix(a, "#000", 0.55);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width={100} height={100} fill={bgc} />
      {k % 4 === 0 && <circle cx={50} cy={50} r={32} fill={a} />}
      {k % 4 === 1 && Array.from({ length: 6 }, (_, i) => <rect key={i} x={0} y={i * 17} width={100} height={8} fill={a} opacity={0.4 + i * 0.1} />)}
      {k % 4 === 2 && <path d="M0,100 L50,20 L100,100Z" fill={a} />}
      {k % 4 === 3 && Array.from({ length: 4 }, (_, i) => <circle key={i} cx={50} cy={50} r={40 - i * 10} fill="none" stroke={a} strokeWidth={4} />)}
      <circle cx={80 + hash(k, 1) * 10} cy={20} r={6} fill="#fff" opacity={0.7} />
    </svg>
  );
}

export default function MusicAppFilm({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const lyrics = [...list(c.lyrics || "City lights are calling, Turn the volume up, Every street a chorus, We never slow down")].slice(0, 4);
  const spin = t * 0.9;
  const pick = expInOut(seg(t, 2.6, 0.9));
  const playing = t > 3.6;
  const lyricP = c01((t - 4.2) / 3.6) * lyrics.length;
  const fan = expOut(seg(t, 8.2, 0.8));
  const outro = expInOut(seg(t, 9.8, 0.5));
  const endP = c01((t - 10.2) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff, perspective: 1800 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* carousel */}
        {t < 3.8 &&
          Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2 + spin * (1 - pick);
            const x = 960 + Math.sin(a) * 760;
            const z = Math.cos(a) * 500 - 300;
            const isPick = i === 0;
            const size = 380;
            const px = lerp(x, 960, isPick ? pick : 0);
            const op = isPick ? 1 : 1 - pick;
            return (
              <div key={i} style={{ position: "absolute", left: px - size / 2, top: 540 - size / 2, width: size, height: size, borderRadius: 18, overflow: "hidden", transform: `translateZ(${isPick ? lerp(z, 200, pick) : z}px) rotateY(${isPick ? lerp((a * 180) / Math.PI, 0, pick) : (a * 180) / Math.PI}deg)`, opacity: op * (1 - c01((t - 3.5) * 4)), boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: Math.round(z + 1000) }}>
                <Cover k={i} pal={pal} size={size} />
              </div>
            );
          })}
        {/* now playing */}
        {t > 3.2 && fan < 1 && (
          <div style={{ position: "absolute", inset: 0, opacity: c01((t - 3.2) * 3) * (1 - fan) }}>
            <Phone x={620} y={560} h={900} pal={pal} s={lerp(0.9, 1, spring(t - 3.2, 16, 0.7))}>
              <div style={{ padding: "90px 30px 0" }}>
                <div style={{ borderRadius: 20, overflow: "hidden", transform: `scale(${playing ? 1 + 0.02 * Math.sin(t * 8.4) : 0.94})` }}>
                  <Cover k={0} pal={pal} size={380} />
                </div>
                <div style={{ marginTop: 30, fontSize: 36, fontWeight: 800, color: pal.fg }}>{c.track || "Night Drive"}</div>
                <div style={{ fontSize: 26, color: pal.muted, marginTop: 4 }}>{c.artist || "The Weekenders"}</div>
                <svg width={380} height={90} style={{ marginTop: 24 }}>
                  {Array.from({ length: 38 }, (_, i) => {
                    const h = playing ? 10 + Math.abs(Math.sin(t * 7 + i * 0.6)) * 70 * (0.4 + hash(i, 2) * 0.6) : 10;
                    return <rect key={i} x={i * 10} y={45 - h / 2} width={6} height={h} rx={3} fill={i / 38 < c01((t - 3.6) / 6) ? pal.v : pal.faint} />;
                  })}
                </svg>
                <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 50, alignItems: "center" }}>
                  <div style={{ width: 0, height: 0, borderRight: `26px solid ${pal.fg}`, borderTop: "18px solid transparent", borderBottom: "18px solid transparent" }} />
                  <div style={{ width: 100, height: 100, borderRadius: 50, background: pal.v, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    {playing ? [0, 1].map((k) => <div key={k} style={{ width: 12, height: 40, background: pal.onV, borderRadius: 3 }} />) : <div style={{ width: 0, height: 0, borderLeft: `32px solid ${pal.onV}`, borderTop: "20px solid transparent", borderBottom: "20px solid transparent", marginLeft: 8 }} />}
                  </div>
                  <div style={{ width: 0, height: 0, borderLeft: `26px solid ${pal.fg}`, borderTop: "18px solid transparent", borderBottom: "18px solid transparent" }} />
                </div>
              </div>
            </Phone>
            <div style={{ position: "absolute", left: 1060, top: 300, width: 760 }}>
              {lyrics.map((l, i) => {
                const on = lyricP >= i && lyricP < i + 1;
                const past = lyricP >= i + 1;
                return (
                  <div key={i} style={{ fontSize: on ? 64 : 48, fontWeight: 800, color: on ? pal.fg : past ? pal.faint : pal.muted, letterSpacing: "-0.02em", marginBottom: 26, transition: "none", opacity: c01((t - 3.8 - i * 0.1) * 3) }}>
                    {l}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* playlists */}
        {fan > 0 &&
          ["Focus", "Run", "Chill", "Party", "Drive"].map((n, i) => {
            const rot = (i - 2) * 9 * fan;
            const x = 960 + (i - 2) * 300 * fan;
            return (
              <div key={n} style={{ position: "absolute", left: x - 180, top: 300 + Math.abs(i - 2) * 30 * fan, width: 360, transform: `rotate(${rot}deg)`, borderRadius: 24, overflow: "hidden", background: pal.card2, boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
                <Cover k={i + 3} pal={pal} size={360} />
                <div style={{ padding: "18px 24px", fontSize: 34, fontWeight: 800, color: pal.fg }}>{n}</div>
              </div>
            );
          })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Your soundtrack, everywhere."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 10.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/music-app-film.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = cubicInOut;
