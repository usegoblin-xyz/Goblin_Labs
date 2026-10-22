// Better Auth on the client: the auth client, small hooks shaped like the ones
// the pages already use, a user menu, and the sign-in / sign-up form.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createAuthClient } from "better-auth/react";
import { dashClient } from "@better-auth/infra/client";
import { LogOut, User as UserIcon } from "lucide-react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
  plugins: [dashClient()],
});

type SessionUser = { id: string; name: string; email: string; image?: string | null };

export function useAuth() {
  const { data, isPending } = authClient.useSession();
  return {
    isLoaded: !isPending,
    isSignedIn: !!data?.user,
    userId: data?.user.id ?? null,
    // API routes read the session cookie, so no bearer token is needed.
    getToken: async () => null as string | null,
    signOut: () => authClient.signOut(),
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

// Avatar button with a small menu: Account and Sign out.
export function UserButton({ afterSignOutUrl = "/" }: { afterSignOutUrl?: string; userProfileMode?: string; userProfileUrl?: string }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  if (!user) return null;
  const initial = (user.fullName || user.primaryEmailAddress.emailAddress)[0]?.toUpperCase() ?? "?";
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#22a03a] text-[13px] font-bold text-white" aria-label="Account menu">
        {user.imageUrl ? <img src={user.imageUrl} alt="" className="h-full w-full object-cover" /> : initial}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-white/12 bg-[#0d0d0d] p-1.5 text-[13px] text-white shadow-2xl">
          <div className="truncate px-3 py-2 text-white/50">{user.primaryEmailAddress.emailAddress}</div>
          <a href="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/[0.06]">
            <UserIcon className="h-4 w-4" /> Account
          </a>
          <button
            onClick={async () => {
              await authClient.signOut();
              window.location.href = afterSignOutUrl;
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/[0.06]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
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
}: {
  initialMode?: "sign-up" | "sign-in";
  callbackURL?: string;
  onDone?: () => void;
  tone?: "dark" | "light";
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
    onDone?.();
  };

  const google = async () => {
    setError("");
    const res = await authClient.signIn.social({ provider: "google", callbackURL: window.location.origin + callbackURL });
    if (res?.error) setError("Google sign-in isn't available right now. Use your email instead.");
  };

  return (
    <div>
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
