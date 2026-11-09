// What Claude is shown of the user's attachments and links.
//
// Every attachment is either for the video (their photo, clip or music goes in
// it) or a reference (Goblin looks at it for style, facts or copy), or "auto"
// (Goblin decides from what the user said). Photos and clips are shown as a
// small JPEG (a clip as a contact sheet of frames), PDFs and text files as
// documents, music as its tempo and beat grid. Links in the user's message are
// fetched here and read as text.
import type Anthropic from "@anthropic-ai/sdk";
import dns from "node:dns/promises";
import net from "node:net";
import { db } from "./db.js";
import { readLink } from "./media.js";
import { parseMediaRef } from "../../src/library/media.js";

export type Use = "auto" | "video" | "reference";
export type Attachment = {
  ref: string;
  use: Use;
  kind: "image" | "video" | "audio" | "doc";
  mime: string;
  name: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  meta: Record<string, unknown>;
  pathname: string;
  preview: string | null;
};
export type AttachmentIn = { ref: string; use?: Use };

const asUse = (u: unknown): Use => (u === "video" || u === "reference" ? u : "auto");

// The caller's own attachments, in the order given (others are dropped).
export async function loadAttachments(userId: string, list: unknown, max = 8): Promise<Attachment[]> {
  const items: AttachmentIn[] = (Array.isArray(list) ? list : [])
    .map((x) => (typeof x === "string" ? { ref: x } : x && typeof x === "object" ? { ref: String((x as AttachmentIn).ref ?? ""), use: asUse((x as AttachmentIn).use) } : null))
    .filter((x): x is AttachmentIn => !!x && !!parseMediaRef(x.ref))
    .slice(-max);
  if (!items.length) return [];
  const ids = items.map((i) => parseMediaRef(i.ref)!.id);
  const { rows } = await db().query(`select * from studio.media where user_id = $1 and id = any($2::uuid[])`, [userId, ids]);
  const byId = new Map(rows.map((r) => [r.id as string, r]));
  return items.flatMap((i) => {
    const r = byId.get(parseMediaRef(i.ref)!.id);
    if (!r) return [];
    return [{ ref: i.ref, use: i.use ?? "auto", kind: r.kind, mime: r.mime, name: r.name, width: r.width, height: r.height, durationSeconds: r.duration_seconds, meta: r.meta ?? {}, pathname: r.pathname, preview: r.preview_pathname }];
  });
}

const fmt = (s: number) => (s >= 10 ? Math.round(s) : +s.toFixed(1)) + "s";

// One line about an attachment, as Claude reads it.
export function describe(a: Attachment): string {
  const r = parseMediaRef(a.ref);
  const role = a.use === "video" ? "to put IN the video" : a.use === "reference" ? "as a REFERENCE only (look at it; don't put it in the video)" : "(use it the way the user's words suggest)";
  if (a.kind === "image") return `Photo "${a.name}"${a.width && a.height ? ` (${a.width}x${a.height})` : ""}, ref "${a.ref}", ${role}.`;
  if (a.kind === "video") {
    const kept = r?.start != null && r?.end != null ? `trimmed to ${fmt(r.end - r.start)} (${fmt(r.start)} to ${fmt(r.end)})` : a.durationSeconds ? `${fmt(a.durationSeconds)} long` : "";
    return `Clip "${a.name}"${a.width && a.height ? ` (${a.width}x${a.height}` : " ("}${kept ? `, ${kept}` : ""}), ref "${a.ref}", ${role}. The image shown for it is a contact sheet of frames from the clip, in order.`;
  }
  if (a.kind === "audio") {
    const bpm = typeof a.meta.bpm === "number" ? `${Math.round(a.meta.bpm as number)} BPM` : "tempo unknown";
    const beats = Array.isArray(a.meta.beats) ? (a.meta.beats as number[]) : [];
    const start = r?.start ?? 0;
    const firsts = beats.filter((b) => b >= start).slice(0, 24).map((b) => +(b - start).toFixed(2));
    return `${a.meta.generated ? `Goblin-made ${a.meta.mood ?? ""} music` : `Music track "${a.name}"`} (${a.durationSeconds ? fmt(a.durationSeconds) : "length unknown"}, ${bpm}), ref "${a.ref}", ${role === "(use it the way the user's words suggest)" ? "as the video's soundtrack" : role}. Beats from where it starts playing, in seconds: [${firsts.join(", ")}${beats.length > firsts.length ? ", …" : ""}].`;
  }
  return `Document "${a.name}"${typeof a.meta.pages === "number" ? ` (${a.meta.pages} pages)` : ""}, a reference: read it for the facts, names, numbers and copy.`;
}

async function bytes(pathname: string): Promise<Buffer | null> {
  try {
    const r = await fetch(await readLink(pathname));
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

// Content blocks for the attachments: pictures and documents Claude can see.
// Music has no picture, so it's described in text only.
export async function blocks(list: Attachment[]): Promise<Anthropic.ContentBlockParam[]> {
  const out: Anthropic.ContentBlockParam[] = [];
  for (const a of list) {
    if ((a.kind === "image" || a.kind === "video") && a.preview) {
      const b = await bytes(a.preview);
      if (b) out.push({ type: "text", text: describe(a) }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b.toString("base64") } });
      else out.push({ type: "text", text: describe(a) + " (Its preview couldn't be loaded.)" });
    } else if (a.kind === "doc") {
      const b = await bytes(a.pathname);
      if (!b) {
        out.push({ type: "text", text: describe(a) + " (It couldn't be loaded.)" });
      } else if (a.mime === "application/pdf") {
        out.push({ type: "text", text: describe(a) }, { type: "document", title: a.name.slice(0, 200), source: { type: "base64", media_type: "application/pdf", data: b.toString("base64") } });
      } else {
        out.push({ type: "text", text: describe(a) }, { type: "document", title: a.name.slice(0, 200), source: { type: "text", media_type: "text/plain", data: b.toString("utf8").slice(0, 200_000) } });
      }
    } else {
      out.push({ type: "text", text: describe(a) });
    }
  }
  return out;
}

// ---- links ------------------------------------------------------------------------
export type LinkRead = { url: string; title: string; text: string; ok: boolean };
const URL_RE = /\bhttps?:\/\/[^\s<>"'()]+[^\s<>"'().,!?;:]/gi;
export const linksIn = (text: string) => [...new Set(text.match(URL_RE) ?? [])].slice(0, 3);

function privateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:") && privateIp(v.slice(7));
}

async function safeUrl(raw: string): Promise<URL | null> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol) || (u.port && !["80", "443"].includes(u.port)) || u.username || u.password) return null;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) return null;
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) return null;
  return u;
}

const decode = (s: string) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n) % 0x110000));

export function htmlToText(html: string): { title: string; text: string } {
  const title = decode((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "").trim()).slice(0, 200);
  const desc = decode(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] ?? "");
  const body = html
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|section|article|br|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const text = decode(body).replace(/[ \t\f\v]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  return { title, text: [desc, text].filter(Boolean).join("\n").slice(0, 12000) };
}

export async function readLinkPage(raw: string): Promise<LinkRead> {
  let url = await safeUrl(raw);
  const fail = { url: raw, title: "", text: "", ok: false };
  for (let hop = 0; url && hop < 4; hop++) {
    try {
      const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "user-agent": "GoblinBot/1.0 (+https://www.usegoblin.xyz)", accept: "text/html,text/plain;q=0.9,*/*;q=0.1" } });
      if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
        url = await safeUrl(new URL(r.headers.get("location")!, url).toString());
        continue;
      }
      if (!r.ok) return fail;
      const type = (r.headers.get("content-type") || "").toLowerCase();
      if (!/text\/html|text\/plain|application\/xhtml/.test(type)) return fail;
      // Read at most 2 MB.
      const reader = r.body?.getReader();
      let got = 0;
      const parts: Uint8Array[] = [];
      while (reader) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        parts.push(value);
        got += value.length;
        if (got > 2_000_000) {
          await reader.cancel();
          break;
        }
      }
      const html = Buffer.concat(parts).toString("utf8");
      const page = type.includes("text/plain") ? { title: url.hostname, text: html.slice(0, 12000) } : htmlToText(html);
      return { url: raw, title: page.title, text: page.text, ok: page.text.length > 40 };
    } catch {
      return fail;
    }
  }
  return fail;
}
