// All Better Auth endpoints: /api/auth/sign-up/email, /api/auth/sign-in/email,
// /api/auth/sign-in/social, /api/auth/callback/google, /api/auth/get-session, ...
// vercel.json rewrites /api/auth/<path> here as ?__ba=<path>; the original URL
// is restored before Better Auth routes the request.
import type { IncomingMessage, ServerResponse } from "node:http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./_betterauth.js";

export const config = { api: { bodyParser: false } };

const handler = toNodeHandler(auth);

export default function authRoute(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://local");
  const path = url.searchParams.get("__ba");
  if (path !== null) {
    url.searchParams.delete("__ba");
    const qs = url.searchParams.toString();
    req.url = `/api/auth/${path}${qs ? `?${qs}` : ""}`;
  }
  return handler(req, res);
}
