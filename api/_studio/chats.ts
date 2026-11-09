// /api/studio?op=chats: the user's saved conversations.
//   GET               → { chats: [{ id, title, updatedAt }] }   newest first
//   GET ?id=          → { chat: { id, title, turns, updatedAt } }
//   PUT { id, title, turns }  saves a chat (creates it the first time)
//   PATCH { id, title }       renames it
//   DELETE ?id=               deletes it
// A chat is stored as the page's turns, without anything temporary: templates,
// videos and uploads are kept as ids and loaded fresh when it's reopened.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 1_500_000;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function makeHandler(userIdOf: (req: VercelRequest) => Promise<string | null>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader("cache-control", "no-store");
    const userId = await userIdOf(req);
    if (!userId) return res.status(401).json({ error: "Sign in to see your chats." });
    const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) ?? {};
    const id = String((req.method === "GET" || req.method === "DELETE" ? req.query.id : body.id) ?? "");

    if (req.method === "GET") {
      if (!id) {
        const { rows } = await db().query(`select id, title, updated_at from studio.conversations where user_id = $1 order by updated_at desc limit 200`, [userId]);
        return res.status(200).json({ chats: rows.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updated_at })) });
      }
      if (!UUID.test(id)) return res.status(404).json({ error: "Chat not found." });
      const { rows } = await db().query(`select id, title, turns, updated_at from studio.conversations where user_id = $1 and id = $2`, [userId, id]);
      if (!rows[0]) return res.status(404).json({ error: "Chat not found." });
      return res.status(200).json({ chat: { id: rows[0].id, title: rows[0].title, turns: rows[0].turns, updatedAt: rows[0].updated_at } });
    }

    if (!UUID.test(id)) return res.status(400).json({ error: "Which chat?" });

    if (req.method === "PUT") {
      const turns = Array.isArray(body.turns) ? body.turns.slice(-400) : [];
      const json = JSON.stringify(turns);
      if (json.length > MAX_BYTES) return res.status(413).json({ error: "This chat is too long to save." });
      const title = str(body.title, 80) || "New chat";
      // An id that belongs to someone else is never overwritten.
      const { rowCount } = await db().query(
        `insert into studio.conversations (id, user_id, title, turns) values ($1, $2, $3, $4::jsonb)
         on conflict (id) do update set title = excluded.title, turns = excluded.turns, updated_at = now()
         where studio.conversations.user_id = excluded.user_id`,
        [id, userId, title, json],
      );
      if (!rowCount) return res.status(409).json({ error: "That chat can't be saved." });
      return res.status(200).json({ ok: true });
    }
    if (req.method === "PATCH") {
      const title = str(body.title, 80);
      if (!title) return res.status(400).json({ error: "Give it a name." });
      await db().query(`update studio.conversations set title = $3 where user_id = $1 and id = $2`, [userId, id, title]);
      return res.status(200).json({ ok: true });
    }
    if (req.method === "DELETE") {
      await db().query(`delete from studio.conversations where user_id = $1 and id = $2`, [userId, id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed." });
  };
}
