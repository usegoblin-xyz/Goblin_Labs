// /api/studio: template generation and saved templates in one function,
// to stay inside the Hobby plan's 12 serverless functions.
//   ?op=generate   POST, see api/_studio/generate.ts
//   ?op=templates  GET / POST / DELETE, see api/_studio/templates.ts
//   ?op=chat       POST, see api/_studio/chat.ts
//   ?op=video      GET / POST, explainer videos, see api/_studio/videos.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "./_auth.js";
import { callClaude, MODEL } from "./_studio/claude.js";
import { makeHandler as makeGenerate } from "./_studio/generate.js";
import { makeHandler as makeTemplates } from "./_studio/templates.js";
import { CHAT_MODEL, callChat, makeHandler as makeChat } from "./_studio/chat.js";
import { agentApi } from "./_studio/agent.js";
import { makeHandler as makeVideos } from "./_studio/videos.js";
import { traceFor, tracedChat, tracedTemplate } from "./_studio/llm.js";

const templates = makeTemplates(getUserId);
const hasKey = () => !!process.env.ANTHROPIC_API_KEY;

// Chat and generation are built per request, so each Claude call can be
// reported to PostHog under the signed-in user and the chat it belongs to.
function traced(req: VercelRequest) {
  const trace = traceFor(req);
  const userId = async (r: VercelRequest) => (trace.userId = await getUserId(r));
  return { trace, userId };
}
const videos = makeVideos({ agent: agentApi, userId: getUserId });

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.op === "generate") {
    const { trace, userId } = traced(req);
    return makeGenerate({ call: tracedTemplate(callClaude, trace, MODEL), userId, configured: hasKey })(req, res);
  }
  if (req.query.op === "templates") return templates(req, res);
  if (req.query.op === "chat") {
    const { trace, userId } = traced(req);
    return makeChat({ call: tracedChat(callChat, trace, CHAT_MODEL), userId, configured: hasKey })(req, res);
  }
  if (req.query.op === "video") return videos(req, res);
  return res.status(404).json({ error: "Not found" });
}
