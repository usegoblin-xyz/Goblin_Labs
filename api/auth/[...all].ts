// All Better Auth endpoints: /api/auth/sign-up/email, /api/auth/sign-in/email,
// /api/auth/sign-in/social, /api/auth/callback/google, /api/auth/get-session, ...
import { toNodeHandler } from "better-auth/node";
import { auth } from "../_betterauth.js";

export const config = { api: { bodyParser: false } };

export default toNodeHandler(auth);
