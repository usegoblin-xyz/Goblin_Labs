// Finds a music track's tempo and beats in the browser, so templates can cut
// on the beat. Works on the decoded audio: an onset curve (how suddenly the
// sound gets louder, weighted towards the bass), its autocorrelation for the
// tempo, a comb search for where the beats fall, then each beat nudged to the
// nearest real onset. Also returns bar starts and a loudness curve.
export type Analysis = { bpm: number | null; beats: number[]; downbeats: number[]; energy: number[]; duration: number };

const RATE = 22050;
const HOP = 220; // ~100 frames a second

export async function decode(buf: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, 1, RATE);
  return ctx.decodeAudioData(buf.slice(0));
}

// The bass of the track (kicks drive the beat), rendered through a low-pass.
async function bassOf(audio: AudioBuffer): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, audio.length, audio.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = audio;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 160;
  src.connect(lp).connect(ctx.destination);
  src.start();
  return (await ctx.startRendering()).getChannelData(0);
}

function mono(audio: AudioBuffer): Float32Array {
  if (audio.numberOfChannels === 1) return audio.getChannelData(0);
  const out = new Float32Array(audio.length);
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const d = audio.getChannelData(c);
    for (let i = 0; i < d.length; i++) out[i] += d[i] / audio.numberOfChannels;
  }
  return out;
}

function rms(x: Float32Array, hop: number): Float32Array {
  const n = Math.floor(x.length / hop);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i * hop; j < (i + 1) * hop; j++) s += x[j] * x[j];
    out[i] = Math.sqrt(s / hop);
  }
  return out;
}

function onsets(env: Float32Array): Float32Array {
  const out = new Float32Array(env.length);
  for (let i = 1; i < env.length; i++) out[i] = Math.max(0, Math.log1p(env[i] * 100) - Math.log1p(env[i - 1] * 100));
  // Remove the slow trend so loud sections don't dominate.
  const w = 50;
  const res = new Float32Array(env.length);
  let acc = 0;
  for (let i = 0; i < out.length; i++) {
    acc += out[i] - (i >= w ? out[i - w] : 0);
    res[i] = Math.max(0, out[i] - acc / Math.min(i + 1, w));
  }
  return res;
}

export async function analyse(buf: ArrayBuffer): Promise<Analysis> {
  const audio = await decode(buf);
  const fps = audio.sampleRate / HOP;
  const full = mono(audio);
  const bass = await bassOf(audio);
  const eFull = rms(full, HOP);
  const eBass = rms(bass, HOP);
  const o = onsets(eFull);
  const ob = onsets(eBass);
  const n = Math.min(o.length, ob.length);
  const odf = new Float32Array(n);
  for (let i = 0; i < n; i++) odf[i] = o[i] + 1.5 * ob[i];
  const duration = audio.duration;

  // Loudness at 10 points a second, 0 to 1.
  const step = Math.round(fps / 10);
  const energy: number[] = [];
  let peak = 1e-9;
  for (let i = 0; i < eFull.length; i += step) {
    let s = 0;
    for (let j = i; j < Math.min(eFull.length, i + step); j++) s = Math.max(s, eFull[j]);
    energy.push(s);
    peak = Math.max(peak, s);
  }
  const loud = energy.map((e) => +(e / peak).toFixed(3));

  // Tempo: autocorrelation over 60 to 190 BPM. A lag also scores for its
  // double (the bar-level pulse), which steadies the octave choice, and
  // tempos around 110 are favoured.
  const minLag = Math.floor((60 / 190) * fps);
  const maxLag = Math.ceil((60 / 60) * fps);
  const N = Math.min(n, Math.round(fps * 90)); // the first 90 s is plenty
  const acf = new Float32Array(maxLag * 2 + 2);
  for (let lag = minLag; lag <= maxLag * 2 + 1; lag++) {
    let s = 0;
    for (let i = lag; i < N; i++) s += odf[i] * odf[i - lag];
    acf[lag] = s / Math.max(1, N - lag);
  }
  let best = 0;
  let bestLag = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const bpm = (60 * fps) / lag;
    const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 110) / 0.75, 2));
    const s = (acf[lag] + 0.5 * acf[lag * 2] + 0.25 * (acf[lag * 2 - 1] + acf[lag * 2 + 1])) * w;
    if (s > best) {
      best = s;
      bestLag = lag;
    }
  }
  if (!bestLag || best <= 0) return { bpm: null, beats: [], downbeats: [], energy: loud, duration };
  // Sub-frame period from a parabola through the peak.
  const ac = (lag: number) => acf[lag] ?? 0;
  const a = ac(bestLag - 1), b = ac(bestLag), c = ac(bestLag + 1);
  const period = bestLag + (a - c !== 0 ? (0.5 * (a - c)) / (a - 2 * b + c || 1) : 0);

  // Phase: the offset whose comb of beats hits the most onsets.
  let bestPhase = 0;
  let bestScore = -1;
  for (let ph = 0; ph < period; ph += 0.5) {
    let s = 0;
    for (let t = ph; t < n; t += period) s += odf[Math.round(t)] ?? 0;
    if (s > bestScore) {
      bestScore = s;
      bestPhase = ph;
    }
  }
  // Beats, each pulled to the strongest onset within 6% of a period.
  const beats: number[] = [];
  const win = Math.max(1, Math.round(period * 0.06));
  for (let t = bestPhase; t < n; t += period) {
    const c0 = Math.round(t);
    let m = c0;
    for (let j = c0 - win; j <= c0 + win; j++) if ((odf[j] ?? -1) > (odf[m] ?? -1)) m = j;
    beats.push(+(((odf[m] ?? 0) > 0 ? m : c0) / fps).toFixed(3));
  }
  // Bars: of the four ways to group beats in fours, the one with the most bass.
  let bar = 0;
  let barScore = -1;
  for (let k = 0; k < 4; k++) {
    let s = 0;
    for (let i = k; i < beats.length; i += 4) s += eBass[Math.round(beats[i] * fps)] ?? 0;
    if (s > barScore) {
      barScore = s;
      bar = k;
    }
  }
  const downbeats = beats.filter((_, i) => i % 4 === bar);
  return { bpm: +((60 * fps) / period).toFixed(2), beats, downbeats, energy: loud, duration };
}
