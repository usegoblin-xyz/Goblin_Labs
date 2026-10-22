// Better Auth server: email + password and Google sign-in, sessions in
// Postgres (Supabase project "goblin-auth", schema better_auth). The dash()
// plugin reports to the Better Auth Infrastructure dashboard.
import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import pg from "pg";

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
