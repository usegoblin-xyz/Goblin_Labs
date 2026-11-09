// GET /api/studio?op=usage: what the signed-in user has used in the last 24
// hours against each limit, for the Usage panel in the account menu.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, chatsToday, usedToday } from "./db.js";
import { DAILY_LIMIT } from "./generate.js";
import { CHAT_LIMIT } from "./chat.js";
import { EDIT_LIMIT, VIDEO_LIMIT } from "./videos.js";

export function makeHandler(userIdOf: (req: VercelRequest) => Promise<string | null>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
    const userId = await userIdOf(req);
    if (!userId) return res.status(401).json({ error: "Sign in to see your usage." });
    const [builds, chats, videos] = await Promise.all([
      usedToday(userId),
      chatsToday(userId),
      db()
        .query(`select count(*) filter (where kind = 'explainer')::int as explainers, count(*) filter (where kind = 'edit')::int as edits from studio.videos where user_id = $1 and created_at > now() - interval '24 hours'`, [userId])
        .then((r) => r.rows[0] as { explainers: number; edits: number }),
    ]);
    res.setHeader("cache-control", "no-store");
    return res.status(200).json({
      plan: "Free",
      window: "24h",
      limits: [
        { key: "builds", label: "Videos built or changed", used: builds, limit: DAILY_LIMIT },
        { key: "explainers", label: "Explainer videos", used: videos.explainers, limit: VIDEO_LIMIT() },
        { key: "edits", label: "Edits by Goblin Editor", used: videos.edits, limit: EDIT_LIMIT() },
        { key: "messages", label: "Messages to Goblin", used: chats, limit: CHAT_LIMIT },
      ],
    });
  };
}
