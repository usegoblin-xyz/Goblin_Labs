// Better Auth server: email + password and Google sign-in, sessions in
// Postgres (Supabase project "goblin-auth", schema better_auth). The dash()
// plugin reports to the Better Auth Infrastructure dashboard.
import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import pg from "pg";
import { sendApproveEmailChange, sendVerifyNewEmail } from "./_mail.js";

const env = process.env;
const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
    : undefined;

export const auth = betterAuth({
  // Production sets BETTER_AUTH_URL; previews infer the URL from the request.
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: new pg.Pool({ connectionString: env.DATABASE_URL, max: 3, ssl: { rejectUnauthorized: false } }),
  emailAndPassword: { enabled: true, autoSignIn: true, minPasswordLength: 8 },
  socialProviders: google,
  // Account console: people can delete their own account (password, or a
  // recent sign-in for Google-only accounts) and connect Google to an
  // existing email account with the same address.
  user: {
    deleteUser: { enabled: true },
    // Email changes are confirmed by link: the new address must click to
    // take over, and verified accounts approve from the old inbox first.
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => sendApproveEmailChange(user.email, newEmail, url, user.name),
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => sendVerifyNewEmail(user.email, url, user.name),
    expiresIn: 3600,
  },
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  // Failed or cancelled OAuth flows (Google sign-in/linking) land on our
  // login page with ?error=<code> instead of Better Auth's dev error page.
  // Flows can override this per call with errorCallbackURL.
  onAPIError: { errorURL: "/login" },
  // Rate limits key on the visitor's IP. On Vercel, x-vercel-forwarded-for
  // and x-real-ip are set by the edge and overwrite anything a client sends,
  // so they can't be spoofed; x-forwarded-for is the last fallback.
  advanced: {
    ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"] },
  },
  // Counts live in Postgres (better_auth."rateLimit"), shared by every
  // serverless instance; in-memory counts would reset on each cold start.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/change-password": { window: 60, max: 5 },
      "/change-email": { window: 300, max: 3 },
      "/delete-user": { window: 300, max: 5 },
      "/get-session": false,
    },
  },
  trustedOrigins: [
    "https://www.usegoblin.xyz",
    "https://usegoblin.xyz",
    ...(env.VERCEL_URL ? [`https://${env.VERCEL_URL}`] : []),
    ...(env.VERCEL_BRANCH_URL ? [`https://${env.VERCEL_BRANCH_URL}`] : []),
    "http://localhost:5173",
  ],
  // dash() reads BETTER_AUTH_API_KEY from the environment
  plugins: [dash()],
});
