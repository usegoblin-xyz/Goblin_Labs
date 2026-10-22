// Session lookup for API routes: reads the Better Auth session cookie that the
// browser sends with same-origin requests.
import type { VercelRequest } from "@vercel/node";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./_betterauth.js";

// Returns the signed-in user's id, or null if the request isn't authenticated.
export async function getUserId(req: VercelRequest): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    return session?.user.id ?? null;
  } catch {
    return null;
  }
}
