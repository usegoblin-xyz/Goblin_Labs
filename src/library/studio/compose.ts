// Goblin-made music: an original, loopable track in a mood, synthesised in
// the browser (oscillators and noise through an offline audio graph), so it's
// free to use and its beats are known exactly. Each mood is a tempo, a key, a
// four-chord progression and a set of parts (pads, plucks, bass, drums).
export const MOODS = ["calm", "upbeat", "cinematic", "lofi", "epic", "playful", "corporate"] as const;
export type Mood = (typeof MOODS)[number];

type Part = "pad" | "arp" | "keys" | "bass" | "stab" | "kick4" | "kick13" | "halftime" | "clap24" | "hats8" | "swinghats" | "shaker" | "toms" | "drone" | "impact" | "vinyl" | "ostinato" | "marimba";
type Spec = { bpm: number; root: number; minor: boolean; prog: number[][]; parts: Part[]; bright: number; reverb: number };

// Chords as scale degrees (0 = root) stacked in thirds.
const SPECS: Record<Mood, Spec> = {
  calm: { bpm: 76, root: 62, minor: false, prog: [[0, 2, 4, 6], [5, 7, 9, 11], [3, 5, 7, 9], [4, 6, 8, 10]], parts: ["pad", "arp", "bass"], bright: 1400, reverb: 0.45 },
  upbeat: { bpm: 120, root: 60, minor: false, prog: [[0, 2, 4], [4, 6, 8], [5, 7, 9], [3, 5, 7]], parts: ["kick4", "clap24", "hats8", "bass", "stab", "pad"], bright: 5000, reverb: 0.2 },
  cinematic: { bpm: 90, root: 57, minor: true, prog: [[0, 2, 4], [5, 7, 9], [2, 4, 6], [6, 8, 10]], parts: ["drone", "pad", "toms", "impact", "ostinato"], bright: 2200, reverb: 0.55 },
  lofi: { bpm: 84, root: 62, minor: false, prog: [[1, 3, 5, 7], [4, 6, 8, 10], [0, 2, 4, 6], [5, 7, 9, 11]], parts: ["kick13", "clap24", "swinghats", "keys", "bass", "vinyl"], bright: 2600, reverb: 0.3 },
  epic: { bpm: 140, root: 55, minor: true, prog: [[0, 2, 4], [5, 7, 9], [6, 8, 10], [0, 2, 4]], parts: ["halftime", "toms", "stab", "pad", "bass", "impact", "ostinato"], bright: 4200, reverb: 0.45 },
  playful: { bpm: 124, root: 65, minor: false, prog: [[0, 2, 4], [3, 5, 7], [4, 6, 8], [3, 5, 7]], parts: ["kick13", "clap24", "marimba", "bass", "shaker"], bright: 6000, reverb: 0.2 },
  corporate: { bpm: 108, root: 60, minor: false, prog: [[0, 2, 4], [4, 6, 8], [5, 7, 9], [3, 5, 7]], parts: ["kick4", "clap24", "shaker", "arp", "pad", "bass"], bright: 4500, reverb: 0.3 },
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const note = (s: Spec, degree: number) => {
  const sc = s.minor ? MINOR : MAJOR;
  const o = Math.floor(degree / 7);
  return s.root + 12 * o + sc[((degree % 7) + 7) % 7];
};

export type Composed = { blob: Blob; bpm: number; beats: number[]; downbeats: number[]; energy: number[]; duration: number; mood: Mood };

export async function compose(mood: Mood, seconds = 24, seed = 1): Promise<Composed> {
  const s = SPECS[mood];
  const SR = 44100;
  const beat = 60 / s.bpm;
  const bar = beat * 4;
  const bars = Math.max(4, Math.ceil(seconds / bar / 4) * 4); // whole 4-bar phrases, so it loops
  const length = bars * bar;
  const ctx = new OfflineAudioContext(2, Math.ceil(length * SR), SR);
  let rnd = seed * 9301 + 49297;
  const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);

  // Mix: dry and reverb buses into a gentle compressor.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;
  const master = ctx.createGain();
  master.gain.value = 0.8;
  comp.connect(master).connect(ctx.destination);
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = mood === "lofi" ? 4200 : 16000;
  tone.connect(comp);
  const dry = ctx.createGain();
  dry.connect(tone);
  const verb = ctx.createConvolver();
  const irLen = Math.round(SR * 2.4);
  const ir = ctx.createBuffer(2, irLen, SR);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < irLen; i++) d[i] = (rand() * 2 - 1) * Math.pow(1 - i / irLen, 3);
  }
  verb.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = s.reverb;
  verb.connect(wet).connect(tone);
  const send = (node: AudioNode, amount = 1) => {
    node.connect(dry);
    if (amount > 0) {
      const g = ctx.createGain();
      g.gain.value = amount;
      node.connect(g).connect(verb);
    }
  };
  const noise = ctx.createBuffer(1, SR, SR);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < SR; i++) nd[i] = rand() * 2 - 1;

  const env = (g: GainNode, t: number, a: number, peak: number, d: number) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  };
  const osc = (type: OscillatorType, f: number, t: number, dur: number, peak: number, a = 0.005, cutoff = s.bright, rev = 0.4, detune = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = detune;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = cutoff;
    const g = ctx.createGain();
    env(g, t, a, peak, dur);
    o.connect(lp).connect(g);
    send(g, rev);
    o.start(t);
    o.stop(t + a + dur + 0.05);
  };
  const hit = (t: number, peak: number, filter: BiquadFilterType, f: number, dur: number, rev = 0.15) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = filter;
    bp.frequency.value = f;
    const g = ctx.createGain();
    env(g, t, 0.002, peak, dur);
    src.connect(bp).connect(g);
    send(g, rev);
    src.start(t, rand() * 0.5);
    src.stop(t + dur + 0.05);
  };
  const kick = (t: number, peak = 0.9) => {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = ctx.createGain();
    env(g, t, 0.002, peak, 0.38);
    o.connect(g);
    send(g, 0.05);
    o.start(t);
    o.stop(t + 0.45);
  };
  const tom = (t: number, f: number, peak = 0.6) => {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(f * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.15);
    const g = ctx.createGain();
    env(g, t, 0.003, peak, 0.5);
    o.connect(g);
    send(g, 0.35);
    o.start(t);
    o.stop(t + 0.6);
  };

  for (let b = 0; b < bars; b++) {
    const t0 = b * bar;
    const chord = s.prog[b % s.prog.length];
    const notes = chord.map((d) => note(s, d));
    const bassNote = note(s, chord[0]) - 24;
    for (const p of s.parts) {
      if (p === "pad") for (const n of notes) for (const det of [-7, 7]) osc("sawtooth", hz(n), t0, bar * 0.95, 0.035, 0.6, s.bright * 0.5, 0.8, det);
      if (p === "drone" && b % 2 === 0) osc("sawtooth", hz(s.root - 24), t0, bar * 2, 0.08, 1.2, 400, 0.6);
      if (p === "keys") for (const n of notes) {
        osc("triangle", hz(n), t0, beat * 2.6, 0.06, 0.01, 2400, 0.5);
        osc("sine", hz(n), t0 + beat * 2.5, beat * 1.4, 0.04, 0.01, 2400, 0.5);
      }
      if (p === "arp") for (let i = 0; i < 8; i++) osc("triangle", hz(notes[i % notes.length] + (i >= 4 ? 12 : 0)), t0 + i * beat * 0.5, beat * 0.9, 0.05, 0.004, s.bright, 0.5);
      if (p === "marimba") for (let i = 0; i < 8; i++) {
        const pent = [0, 2, 4, 7, 9];
        const n = s.root + 12 + pent[Math.floor(rand() * pent.length)] + (i % 4 === 0 ? 0 : 12 * Math.round(rand()));
        osc("sine", hz(n), t0 + i * beat * 0.5, 0.22, 0.12, 0.002, 8000, 0.25);
      }
      if (p === "ostinato") for (let i = 0; i < 16; i++) osc("sawtooth", hz(notes[i % 2 === 0 ? 0 : 1] + 12), t0 + i * beat * 0.25, beat * 0.2, 0.012 + 0.02 * (b % 4) / 3, 0.003, 1800, 0.3);
      if (p === "stab") for (const off of [0.5, 1.5, 2.5, 3.5]) for (const n of notes) osc("square", hz(n), t0 + off * beat, beat * 0.25, 0.025, 0.003, s.bright * 0.6, 0.3);
      if (p === "bass") {
        const hits = mood === "upbeat" || mood === "corporate" ? [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] : mood === "playful" ? [0, 1.5, 2, 3.5] : [0, 2, 2.75];
        for (const h of hits) osc(mood === "calm" ? "sine" : "triangle", hz(bassNote + (h % 1 ? 12 : 0) * (mood === "upbeat" ? 1 : 0)), t0 + h * beat, beat * (mood === "calm" ? 3.8 : 0.45), mood === "calm" ? 0.12 : 0.16, 0.005, 500, 0.05);
      }
      if (p === "kick4") for (let i = 0; i < 4; i++) kick(t0 + i * beat);
      if (p === "kick13") for (const h of [0, 2, 2.5]) kick(t0 + h * beat, h === 2.5 ? 0.6 : 0.85);
      if (p === "halftime") for (const h of [0, 1.5]) kick(t0 + h * beat, 0.95);
      if (p === "clap24") for (const h of mood === "epic" ? [2] : [1, 3]) hit(t0 + h * beat, 0.32, "bandpass", 1600, 0.16, 0.25);
      if (p === "halftime") hit(t0 + 2 * beat, 0.4, "bandpass", 1400, 0.22, 0.35);
      if (p === "hats8") for (let i = 0; i < 8; i++) hit(t0 + i * beat * 0.5, i % 2 ? 0.08 : 0.04, "highpass", 8000, 0.05, 0.05);
      if (p === "swinghats") for (let i = 0; i < 8; i++) hit(t0 + (Math.floor(i / 2) + (i % 2 ? 0.62 : 0)) * beat, 0.05, "highpass", 7000, 0.04, 0.05);
      if (p === "shaker") for (let i = 0; i < 16; i++) hit(t0 + i * beat * 0.25, i % 4 === 2 ? 0.05 : 0.025, "highpass", 9000, 0.03, 0.05);
      if (p === "toms") for (const h of mood === "epic" ? [0, 0.5, 1, 2, 2.5, 3, 3.25, 3.5] : [0, 2]) tom(t0 + h * beat, mood === "epic" ? 95 : 70, mood === "epic" ? 0.35 : 0.6);
      if (p === "impact" && b % 4 === 0) {
        kick(t0, 1);
        hit(t0, 0.25, "lowpass", 900, 1.6, 0.8);
      }
      if (p === "vinyl" && b === 0) {
        const src = ctx.createBufferSource();
        src.buffer = noise;
        src.loop = true;
        const hp = ctx.createBiquadFilter();
        hp.type = "bandpass";
        hp.frequency.value = 3000;
        const g = ctx.createGain();
        g.gain.value = 0.012;
        src.connect(hp).connect(g).connect(dry);
        src.start(0);
        src.stop(length);
      }
    }
  }

  const out = await ctx.startRendering();
  // Even out loudness across moods: aim for about -18 dB RMS, peaks under -1 dB.
  let sum = 0;
  let pk = 1e-9;
  for (let c = 0; c < out.numberOfChannels; c++) {
    const d = out.getChannelData(c);
    for (let i = 0; i < d.length; i++) {
      sum += d[i] * d[i];
      pk = Math.max(pk, Math.abs(d[i]));
    }
  }
  const rmsNow = Math.sqrt(sum / (out.length * out.numberOfChannels)) || 1e-9;
  // Loud hits (an impact) are softly limited rather than turning the whole track down.
  const gain = Math.min(0.126 / rmsNow, 2.5 / pk);
  for (let c = 0; c < out.numberOfChannels; c++) {
    const d = out.getChannelData(c);
    for (let i = 0; i < d.length; i++) {
      const x = d[i] * gain;
      const a = Math.abs(x);
      d[i] = a <= 0.7 ? x : Math.sign(x) * (0.7 + 0.19 * Math.tanh((a - 0.7) / 0.19));
    }
  }
  const beats = Array.from({ length: bars * 4 }, (_, i) => +(i * beat).toFixed(3));
  const downbeats = beats.filter((_, i) => i % 4 === 0);
  // Loudness at 10 points a second, 0 to 1.
  const L = out.getChannelData(0);
  const step = SR / 10;
  const raw: number[] = [];
  for (let i = 0; i < L.length; i += step) {
    let m = 0;
    for (let j = i; j < Math.min(L.length, i + step); j++) m = Math.max(m, Math.abs(L[j]));
    raw.push(m);
  }
  const peak = Math.max(1e-9, ...raw);
  return { blob: wav(out), bpm: s.bpm, beats, downbeats, energy: raw.map((v) => +(v / peak).toFixed(3)), duration: length, mood };
}

// 16-bit PCM WAV.
function wav(b: AudioBuffer): Blob {
  const ch = b.numberOfChannels;
  const n = b.length;
  const buf = new ArrayBuffer(44 + n * ch * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  v.setUint32(4, 36 + n * ch * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, b.sampleRate, true);
  v.setUint32(28, b.sampleRate * ch * 2, true);
  v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, n * ch * 2, true);
  const chans = Array.from({ length: ch }, (_, c) => b.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      const x = Math.max(-1, Math.min(1, chans[c][i]));
      v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true);
      o += 2;
    }
  return new Blob([buf], { type: "audio/wav" });
}
