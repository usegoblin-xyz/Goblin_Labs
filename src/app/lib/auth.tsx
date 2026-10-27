// Better Auth on the client: the auth client, small hooks shaped like the ones
// the pages already use, a user menu, and the sign-in / sign-up form.
import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { createAuthClient } from "better-auth/react";
import { dashClient } from "@better-auth/infra/client";
import { identifyUser, resetUser, track } from "./analytics";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
  plugins: [dashClient()],
});

// Google sign-in shows only once its OAuth credentials are configured
// (set VITE_GOOGLE_AUTH=1 alongside GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
const GOOGLE_ENABLED = import.meta.env.VITE_GOOGLE_AUTH === "1";

// Friendly text for the `error` code Better Auth adds when an OAuth flow fails
// (it redirects to onAPIError.errorURL or a flow's errorCallbackURL).
export function authErrorMessage(code: string | null | undefined): string {
  if (!code) return "";
  const c = code.toLowerCase();
  if (c === "access_denied" || c.includes("cancel")) return "Google sign-in was cancelled. Try again, or use your email.";
  if (c === "account_already_linked_to_different_user") return "That Google account is already linked to a different Goblin account.";
  if (c === "email_does_not_match") return "That Google account uses a different email than your Goblin account.";
  if (c === "unable_to_link_account") return "We couldn't link that Google account. Sign in with your email, then connect Google from your account.";
  if (c === "email_not_found" || c === "email_not_verified") return "Your Google account didn't share a verified email. Use email and password instead.";
  if (c === "signup_disabled") return "New sign-ups are paused right now.";
  if (c.includes("state") || c === "please_restart_the_process" || c === "invalid_callback_request" || c === "payload_expired")
    return "Your sign-in link expired. Please try again.";
  return "Google sign-in didn't work. Try again, or use your email instead.";
}

// Sign out everywhere: analytics identity first, then the session.
export async function signOut() {
  track("signed_out", {});
  resetUser();
  await authClient.signOut();
}

// Keeps PostHog's identity in step with the Better Auth session: identify on
// sign-in (including after a Google redirect or a returning visit), reset when
// the session ends. Mount once at the app root.
export function AnalyticsIdentity() {
  const { data, isPending } = authClient.useSession();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (isPending) return;
    const u = data?.user;
    if (u) {
      identifyUser({ id: u.id, email: u.email, name: u.name });
      last.current = u.id;
    } else if (last.current) {
      resetUser();
      last.current = null;
    }
  }, [data?.user, isPending]);
  return null;
}

type SessionUser = { id: string; name: string; email: string; image?: string | null };

export function useAuth() {
  const { data, isPending } = authClient.useSession();
  return {
    isLoaded: !isPending,
    isSignedIn: !!data?.user,
    userId: data?.user.id ?? null,
    // API routes read the session cookie, so no bearer token is needed.
    getToken: async () => null as string | null,
    signOut,
  };
}

export function useUser() {
  const { data, isPending } = authClient.useSession();
  const u = data?.user as SessionUser | undefined;
  const first = u?.name?.trim().split(/\s+/)[0] || null;
  return {
    isLoaded: !isPending,
    user: u
      ? {
          id: u.id,
          firstName: first,
          fullName: u.name || null,
          username: null as string | null,
          imageUrl: u.image ?? null,
          primaryEmailAddress: { emailAddress: u.email },
        }
      : null,
  };
}

// Loaded on first open so the console doesn't weigh down the library page.
const AccountConsole = lazy(() => import("./AccountConsole").then((m) => ({ default: m.AccountConsole })));
type ConsoleTab = "profile" | "security" | "danger";

// Avatar button: clicking it opens the account console (profile, security,
// devices, delete). Coming back from connecting Google (?account=security)
// reopens it on the Security tab.
export function UserButton(_: { afterSignOutUrl?: string; userProfileMode?: string; userProfileUrl?: string }) {
  const { user } = useUser();
  const [open, setOpen] = useState<ConsoleTab | null>(null);
  const [linkError, setLinkError] = useState("");
  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("account");
    if (t === "profile" || t === "security" || t === "danger") {
      setOpen(t);
      setLinkError(authErrorMessage(url.searchParams.get("error")));
      url.searchParams.delete("account");
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, []);
  if (!user) return null;
  const initial = (user.fullName || user.primaryEmailAddress.emailAddress)[0]?.toUpperCase() ?? "?";
  return (
    <>
      <button
        onClick={() => setOpen("profile")}
        title="Manage account"
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#22a03a] text-[13px] font-bold text-white ring-white/30 transition hover:ring-2"
        aria-label="Manage account"
      >
        {user.imageUrl ? <img src={user.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : initial}
      </button>
      {open && (
        <Suspense fallback={null}>
          <AccountConsole initialTab={open} initialError={linkError} onClose={() => { setOpen(null); setLinkError(""); }} />
        </Suspense>
      )}
    </>
  );
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
  </svg>
);

// Email + password form with a Google button. `mode` starts on sign-up or
// sign-in; people can switch between them in place.
export function AuthForm({
  initialMode = "sign-up",
  callbackURL = "/",
  onDone,
  tone = "dark",
  initialError = "",
}: {
  initialMode?: "sign-up" | "sign-in";
  callbackURL?: string;
  onDone?: () => void;
  tone?: "dark" | "light";
  initialError?: string;
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  useEffect(() => setError(initialError), [initialError]);
  const dark = tone === "dark";
  const input = dark
    ? "h-11 w-full rounded-xl border border-white/12 bg-white/[0.05] px-3 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#22a03a]"
    : "h-11 w-full rounded-xl border border-[#e7e6e1] bg-[#f4f6f3] px-3 text-[14px] text-[#0d1512] outline-none placeholder:text-[#9aa197] focus:border-[#22a03a]";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setBusy(true);
    const res =
      mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name: email.split("@")[0] })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      const msg = res.error.message ?? "";
      setError(/exist/i.test(msg) ? "That email already has an account. Sign in instead." : /invalid/i.test(msg) ? "Wrong email or password." : msg || "Something went wrong. Try again.");
      return;
    }
    track(mode === "sign-up" ? "signed_up" : "signed_in", { method: "email" });
    onDone?.();
  };

  const google = async () => {
    setError("");
    const res = await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.origin + callbackURL,
      // Failed or cancelled Google sign-ins come back to our login page with
      // ?error=<code>, then continue to where they started once they retry.
      errorCallbackURL: `${window.location.origin}/login?redirect=${encodeURIComponent(callbackURL)}`,
    });
    if (res?.error) setError("Google sign-in isn't available right now. Use your email instead.");
  };

  return (
    <div>
      {GOOGLE_ENABLED && (
      <>
      <button
        type="button"
        onClick={google}
        className={`flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border text-[14px] font-semibold ${
          dark ? "border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]" : "border-[#e7e6e1] bg-white text-[#0d1512] hover:bg-[#fafaf8]"
        }`}
      >
        <GoogleIcon /> Continue with Google
      </button>
      <div className={`my-4 flex items-center gap-3 text-[12px] ${dark ? "text-white/35" : "text-[#9aa197]"}`}>
        <span className={`h-px flex-1 ${dark ? "bg-white/12" : "bg-[#e7e6e1]"}`} /> or <span className={`h-px flex-1 ${dark ? "bg-white/12" : "bg-[#e7e6e1]"}`} />
      </div>
      </>
      )}
      <form onSubmit={submit} className="space-y-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" aria-label="Email" className={input} />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "sign-up" ? "Create a password" : "Password"}
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          aria-label="Password"
          className={input}
        />
        {error && <p className="text-[12.5px] text-[#ff6b5e]">{error}</p>}
        <button disabled={busy} className="h-11 w-full rounded-xl bg-[#22a03a] text-[14px] font-bold text-white hover:bg-[#1c8a31] disabled:opacity-60">
          {busy ? "One moment…" : mode === "sign-up" ? "Sign up" : "Sign in"}
        </button>
      </form>
      <p className={`mt-4 text-center text-[12.5px] ${dark ? "text-white/45" : "text-[#6b7669]"}`}>
        {mode === "sign-up" ? "Already have an account? " : "New here? "}
        <button type="button" onClick={() => { setMode(mode === "sign-up" ? "sign-in" : "sign-up"); setError(""); }} className="font-semibold text-[#22a03a] hover:underline">
          {mode === "sign-up" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}
