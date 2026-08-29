#!/usr/bin/env node
// Clone an audio sample into an Anam voice and attach it to a persona.
//
// Built for the Ben Franklin persona (default target below), but works for any
// persona/sample pair. Talks to the Anam API directly, so it needs ANAM_API_KEY
// in the environment — pull it from Vercel first, then run with --env-file:
//
//   vercel env pull .env.local
//   node --env-file=.env.local scripts/set-franklin-voice.mjs "/path/to/sample.mp3"
//
// Optional overrides:
//   PERSONA_ID   persona to re-point (default: the Ben Franklin persona)
//   VOICE_NAME   display name for the new cloned voice
//   VOICE_LANG   clone language hint (default: en)
//   DRY_RUN=1    clone the voice but DON'T change the live persona
//
// The sample should be a single clean speaker, ~30-90s, and <= 4.5MB (Anam's
// inline-clone cap). Larger clips need Anam's presigned-upload flow, which this
// script intentionally does not implement.

import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";

const ANAM_BASE = "https://api.anam.ai/v1";
const INLINE_LIMIT = 4_718_592; // ~4.5MB

const PERSONA_ID = process.env.PERSONA_ID ?? "42d9fbe9-ce98-46d8-a348-3997b00db56c";
const VOICE_NAME = process.env.VOICE_NAME ?? "Ben Franklin (cloned)";
const VOICE_LANG = process.env.VOICE_LANG ?? "en";
const DRY_RUN = process.env.DRY_RUN === "1";

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const apiKey = process.env.ANAM_API_KEY;
if (!apiKey) {
  die(
    "ANAM_API_KEY is not set. Run `vercel env pull .env.local` then re-run with\n" +
      "  node --env-file=.env.local scripts/set-franklin-voice.mjs <sample>",
  );
}

const samplePath = process.argv[2];
if (!samplePath) die("Usage: node set-franklin-voice.mjs <path-to-audio-sample>");

let size;
try {
  size = statSync(samplePath).size;
} catch {
  die(`Audio file not found: ${samplePath}`);
}
if (size > INLINE_LIMIT) {
  die(
    `Sample is ${(size / 1e6).toFixed(2)}MB, over Anam's ~4.5MB inline limit.\n` +
      "Trim it or use Anam's presigned-upload flow.",
  );
}

const auth = { authorization: `Bearer ${apiKey}` };

async function anam(path, init = {}) {
  const res = await fetch(`${ANAM_BASE}${path}`, {
    ...init,
    headers: { ...auth, ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

// 1. Show what we're about to change.
console.log(`\nPersona:  ${PERSONA_ID}`);
const before = await anam(`/personas/${PERSONA_ID}`);
if (!before.ok) die(`Could not read persona (${before.status}): ${JSON.stringify(before.body)}`);
const oldVoice = before.body?.voice;
console.log(`Current voice:  ${oldVoice?.displayName ?? "?"}  (${oldVoice?.id ?? "?"})`);
console.log(`Sample:   ${samplePath}  (${(size / 1e6).toFixed(2)}MB)\n`);

// 2. Clone the sample into a new Anam voice.
console.log("→ Cloning sample into a new Anam voice …");
const form = new FormData();
form.set("name", VOICE_NAME);
form.set("language", VOICE_LANG);
form.set("enhance", "true");
const buf = readFileSync(samplePath);
form.set("audioFile", new Blob([buf], { type: "audio/mpeg" }), basename(samplePath));

const clone = await anam("/voices", { method: "POST", body: form });
if (!clone.ok) die(`Clone failed (${clone.status}): ${JSON.stringify(clone.body)}`);
const newVoiceId = clone.body?.id;
if (!newVoiceId) die(`Clone returned no voice id: ${JSON.stringify(clone.body)}`);
console.log(`✓ Cloned voice: ${clone.body.displayName ?? VOICE_NAME}`);
console.log(`  id: ${newVoiceId}  provider: ${clone.body.provider ?? "?"}\n`);

if (DRY_RUN) {
  console.log(`DRY_RUN=1 → not touching the live persona. New voiceId: ${newVoiceId}`);
  process.exit(0);
}

// 3. Re-point the persona at the new voice (partial PUT).
console.log("→ Attaching the new voice to the persona …");
let put = await anam(`/personas/${PERSONA_ID}`, {
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ voiceId: newVoiceId }),
});

// Fallback: if the partial PUT is rejected, rebuild a fuller config from the
// persona we already fetched and resend with the swapped voiceId.
if (!put.ok) {
  console.log(`  partial PUT returned ${put.status}; retrying with a full config …`);
  const b = before.body ?? {};
  const full = {
    name: b.name,
    avatarId: b.avatar?.id,
    llmId: b.llmId ?? b.llm?.id,
    systemPrompt: b.systemPrompt ?? b.brain?.systemPrompt,
    voiceId: newVoiceId,
  };
  put = await anam(`/personas/${PERSONA_ID}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(full),
  });
}
if (!put.ok) die(`Persona update failed (${put.status}): ${JSON.stringify(put.body)}`);

// 4. Verify.
const after = await anam(`/personas/${PERSONA_ID}`);
const nowVoice = after.body?.voice;
console.log(`✓ Persona updated.`);
console.log(`  ${oldVoice?.displayName ?? "?"} → ${nowVoice?.displayName ?? "?"} (${nowVoice?.id})`);
if (nowVoice?.id !== newVoiceId) {
  die("Verification mismatch: persona voice id does not match the new clone. Check the Anam dashboard.");
}
console.log(`\nDone. Open the Talk page to hear it:  https://www.usegoblin.xyz/p/${PERSONA_ID}\n`);
