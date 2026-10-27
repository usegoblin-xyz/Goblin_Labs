// Account console: what a signed-in person sees when they click their avatar.
// Profile (name), Security (sign-in methods, password, devices) and account
// deletion, all through Better Auth's built-in endpoints. Renders as a modal
// from the avatar, or inline on /account.
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Laptop, LogOut, Monitor, ShieldCheck, Smartphone, Trash2, User as UserIcon, X } from "lucide-react";
import { authClient, signOut } from "./auth";

type Tab = "profile" | "security" | "danger";
type Account = { id: string; providerId: string; accountId: string; createdAt: Date | string };
type Session = { id: string; token: string; userAgent?: string | null; ipAddress?: string | null; createdAt: Date | string; updatedAt: Date | string };

const GOOGLE_ENABLED = import.meta.env.VITE_GOOGLE_AUTH === "1";

const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const fmtAgo = (d: Date | string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return fmtDate(d);
};

function describeDevice(ua?: string | null) {
  if (!ua) return { name: "Unknown device", mobile: false };
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return { name: os ? `${browser} on ${os}` : browser, mobile: /Mobi|iPhone|Android/.test(ua) };
}

const input =
  "h-10 w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#22a03a] disabled:opacity-60";
const btnPrimary = "h-9 rounded-lg bg-[#22a03a] px-4 text-[13px] font-semibold text-white hover:bg-[#1c8a31] disabled:opacity-50";
const btnGhost = "h-9 rounded-lg border border-white/15 px-3.5 text-[13px] font-medium text-white/85 hover:border-white/30 hover:text-white disabled:opacity-50";

function Section({ title, hint, children }: { title?: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-b border-white/8 py-5 last:border-0">
      {title && <h3 className="text-[14px] font-semibold text-white">{title}</h3>}
      {hint && <p className="mt-0.5 text-[12.5px] text-white/45">{hint}</p>}
      <div className={title ? "mt-3.5" : ""}>{children}</div>
    </section>
  );
}

const Note = ({ tone, children }: { tone: "ok" | "err"; children: ReactNode }) => (
  <p className={`mt-2 text-[12.5px] ${tone === "ok" ? "text-[#5fd67a]" : "text-[#ff6b5e]"}`}>{children}</p>
);

export function Avatar({ name, email, image, size = 32 }: { name?: string | null; email?: string; image?: string | null; size?: number }) {
  const initial = (name || email || "?").trim()[0]?.toUpperCase() ?? "?";
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#22a03a] font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {image ? <img src={image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : initial}
    </span>
  );
}

// ---------- Profile ----------
function ProfileTab() {
  const { data, refetch } = authClient.useSession();
  const user = data?.user;
  const [name, setName] = useState(user?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  useEffect(() => setName(user?.name ?? ""), [user?.name]);
  if (!user) return null;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setMsg({ tone: "err", text: "Your name can't be empty." });
    setBusy(true);
    const res = await authClient.updateUser({ name: n });
    setBusy(false);
    if (res.error) return setMsg({ tone: "err", text: res.error.message || "Couldn't save. Try again." });
    setMsg({ tone: "ok", text: "Saved." });
    refetch();
  };

  return (
    <>
      <Section>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} email={user.email} image={user.image} size={56} />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold">{user.name || "No name yet"}</div>
            <div className="truncate text-[13px] text-white/50">{user.email}</div>
            <div className="mt-0.5 text-[12px] text-white/35">Member since {fmtDate(user.createdAt)}</div>
          </div>
        </div>
      </Section>
      <Section title="Name" hint="Shown on your account.">
        <form onSubmit={save} className="flex gap-2">
          <input value={name} onChange={(e) => { setName(e.target.value); setMsg(null); }} maxLength={80} aria-label="Name" className={input} />
          <button disabled={busy || name.trim() === (user.name ?? "")} className={btnPrimary}>{busy ? "Saving…" : "Save"}</button>
        </form>
        {msg && <Note tone={msg.tone}>{msg.text}</Note>}
      </Section>
      <Section title="Email address" hint="The email you sign in with. Contact obi@usegoblin.xyz to change it.">
        <div className="flex h-10 items-center rounded-lg border border-white/8 bg-white/[0.02] px-3 text-[14px] text-white/70">{user.email}</div>
      </Section>
    </>
  );
}

// ---------- Security ----------
function SecurityTab({ accounts, reload }: { accounts: Account[] | null; reload: () => void }) {
  const { data } = authClient.useSession();
  const currentToken = data?.session.token;
  const hasPassword = !!accounts?.some((a) => a.providerId === "credential");
  const google = accounts?.find((a) => a.providerId === "google");

  const [sessions, setSessions] = useState<Session[] | null>(null);
  const loadSessions = useCallback(async () => {
    const res = await authClient.listSessions();
    setSessions(((res.data as Session[] | null) ?? []).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
  }, []);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const [methodErr, setMethodErr] = useState("");
  const connectGoogle = async () => {
    setMethodErr("");
    const res = await authClient.linkSocial({ provider: "google", callbackURL: `${window.location.pathname}?account=security` });
    if (res?.error) setMethodErr(res.error.message || "Couldn't connect Google.");
  };
  const disconnect = async (a: Account) => {
    setMethodErr("");
    const res = await authClient.unlinkAccount({ accountId: a.id });
    if (res.error) {
      const m = res.error.message ?? "";
      setMethodErr(/fresh|expired/i.test(m) ? "For your safety, sign out and back in, then try again." : m || "Couldn't disconnect.");
    }
    reload();
  };

  // password
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [logoutOthers, setLogoutOthers] = useState(true);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setPwMsg({ tone: "err", text: "Use at least 8 characters for the new password." });
    setPwBusy(true);
    const res = await authClient.changePassword({ currentPassword: cur, newPassword: next, revokeOtherSessions: logoutOthers });
    setPwBusy(false);
    if (res.error) return setPwMsg({ tone: "err", text: /invalid/i.test(res.error.message ?? "") ? "Your current password is wrong." : res.error.message || "Couldn't change it. Try again." });
    setCur(""); setNext("");
    setPwMsg({ tone: "ok", text: logoutOthers ? "Password changed. Other devices were signed out." : "Password changed." });
    loadSessions();
  };

  const revoke = async (s: Session) => { await authClient.revokeSession({ token: s.token }); loadSessions(); };
  const revokeOthers = async () => { await authClient.revokeOtherSessions(); loadSessions(); };
  const others = sessions?.filter((s) => s.token !== currentToken).length ?? 0;

  return (
    <>
      <Section title="Sign-in methods" hint="Ways you can sign in to Goblin.">
        {accounts === null ? (
          <p className="text-[13px] text-white/40">Loading…</p>
        ) : (
          <div className="divide-y divide-white/8 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 px-3.5 py-3">
              <KeyRound className="h-4 w-4 text-white/60" />
              <div className="flex-1 text-[13.5px]">Email and password</div>
              <span className={`text-[12px] ${hasPassword ? "text-[#5fd67a]" : "text-white/35"}`}>{hasPassword ? "Active" : "Not set"}</span>
            </div>
            {(GOOGLE_ENABLED || google) && (
              <div className="flex items-center gap-3 px-3.5 py-3">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" /></svg>
                <div className="flex-1 text-[13.5px]">Google</div>
                {google ? (
                  accounts.length > 1 ? (
                    <button onClick={() => disconnect(google)} className="text-[12.5px] text-white/55 hover:text-[#ff6b5e]">Disconnect</button>
                  ) : (
                    <span className="text-[12px] text-[#5fd67a]">Connected</span>
                  )
                ) : (
                  <button onClick={connectGoogle} className="text-[12.5px] font-semibold text-[#5fd67a] hover:underline">Connect</button>
                )}
              </div>
            )}
          </div>
        )}
        {methodErr && <Note tone="err">{methodErr}</Note>}
      </Section>

      {hasPassword && (
        <Section title="Change password">
          <form onSubmit={changePassword} className="space-y-2.5">
            <input type="password" value={cur} onChange={(e) => { setCur(e.target.value); setPwMsg(null); }} placeholder="Current password" autoComplete="current-password" aria-label="Current password" className={input} />
            <input type="password" value={next} onChange={(e) => { setNext(e.target.value); setPwMsg(null); }} placeholder="New password (8+ characters)" autoComplete="new-password" aria-label="New password" className={input} />
            <label className="flex items-center gap-2 text-[12.5px] text-white/60">
              <input type="checkbox" checked={logoutOthers} onChange={(e) => setLogoutOthers(e.target.checked)} className="accent-[#22a03a]" />
              Sign out of my other devices
            </label>
            <button disabled={pwBusy || !cur || !next} className={btnPrimary}>{pwBusy ? "Changing…" : "Change password"}</button>
          </form>
          {pwMsg && <Note tone={pwMsg.tone}>{pwMsg.text}</Note>}
        </Section>
      )}

      <Section title="Active devices" hint="Where you're signed in right now.">
        {sessions === null ? (
          <p className="text-[13px] text-white/40">Loading…</p>
        ) : (
          <>
            <div className="divide-y divide-white/8 rounded-xl border border-white/10">
              {sessions.map((s) => {
                const d = describeDevice(s.userAgent);
                const current = s.token === currentToken;
                const Icon = d.mobile ? Smartphone : current ? Laptop : Monitor;
                return (
                  <div key={s.id} className="flex items-center gap-3 px-3.5 py-3">
                    <Icon className="h-4 w-4 shrink-0 text-white/60" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px]">
                        {d.name} {current && <span className="ml-1 rounded bg-[#22a03a]/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-[#5fd67a]">This device</span>}
                      </div>
                      <div className="truncate text-[12px] text-white/40">
                        {s.ipAddress ? `${s.ipAddress} · ` : ""}Active {fmtAgo(s.updatedAt)}
                      </div>
                    </div>
                    {!current && <button onClick={() => revoke(s)} className="text-[12.5px] text-white/55 hover:text-[#ff6b5e]">Sign out</button>}
                  </div>
                );
              })}
            </div>
            {others > 0 && (
              <button onClick={revokeOthers} className={`${btnGhost} mt-3`}>Sign out of all other devices</button>
            )}
          </>
        )}
      </Section>
    </>
  );
}

// ---------- Delete ----------
function DangerTab({ accounts }: { accounts: Account[] | null }) {
  const hasPassword = !!accounts?.some((a) => a.providerId === "credential");
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const del = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await authClient.deleteUser(hasPassword ? { password } : {});
    setBusy(false);
    if (res.error) {
      const m = res.error.message ?? "";
      setErr(/password/i.test(m) ? "That password is wrong." : /expired|fresh/i.test(m) ? "For your safety, sign out and back in, then delete your account." : m || "Couldn't delete your account. Try again.");
      return;
    }
    await signOut().catch(() => {});
    window.location.href = "/";
  };

  return (
    <Section title="Delete account" hint="This permanently deletes your Goblin account, sign-in methods and saved sessions. It can't be undone.">
      <form onSubmit={del} className="space-y-2.5">
        {hasPassword && (
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" aria-label="Password" className={input} />
        )}
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder='Type "delete" to confirm' aria-label="Confirm" className={input} />
        <button
          disabled={busy || confirm.trim().toLowerCase() !== "delete" || (hasPassword && !password)}
          className="h-9 rounded-lg bg-[#d93a2b] px-4 text-[13px] font-semibold text-white hover:bg-[#c03224] disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete my account"}
        </button>
      </form>
      {err && <Note tone="err">{err}</Note>}
    </Section>
  );
}

// ---------- Shell ----------
const TABS: { id: Tab; label: string; icon: typeof UserIcon }[] = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "danger", label: "Delete account", icon: Trash2 },
];

export function AccountConsole({ initialTab = "profile", onClose, inline = false }: { initialTab?: Tab; onClose?: () => void; inline?: boolean }) {
  const { data } = authClient.useSession();
  const user = data?.user;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const loadAccounts = useCallback(async () => {
    const res = await authClient.listAccounts();
    setAccounts((res.data as Account[] | null) ?? []);
  }, []);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  useEffect(() => {
    if (inline || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [inline, onClose]);

  if (!user) return null;

  const panel = (
    <div
      className={`flex w-full flex-col overflow-hidden border-white/12 bg-[#0a0a0a] text-[#f5f5f2] sm:flex-row ${
        inline ? "min-h-[560px] rounded-2xl border" : "h-full sm:h-[min(640px,calc(100vh-48px))] sm:max-w-[820px] sm:rounded-2xl sm:border sm:shadow-2xl"
      }`}
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      onClick={(e) => e.stopPropagation()}
      role={inline ? undefined : "dialog"}
      aria-modal={inline ? undefined : true}
      aria-label="Account"
    >
      {/* Rail */}
      <aside className="shrink-0 border-b border-white/8 p-4 sm:w-[220px] sm:border-r sm:border-b-0">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} email={user.email} image={user.image} size={36} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold">{user.name || "Account"}</div>
            <div className="truncate text-[12px] text-white/45">{user.email}</div>
          </div>
          {!inline && onClose && (
            <button onClick={onClose} className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white sm:hidden" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto sm:flex-col">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] ${
                tab === t.id ? "bg-white/[0.08] font-medium text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white"
              } ${t.id === "danger" && tab !== t.id ? "sm:mt-auto" : ""}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={async () => { await signOut(); window.location.href = "/"; }}
          className="mt-3 hidden w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] text-white/60 hover:bg-white/[0.04] hover:text-white sm:flex"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      {/* Content */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-7">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#0a0a0a] pt-5 pb-1">
          <h2 className="text-[18px] font-bold tracking-tight">{TABS.find((t) => t.id === tab)?.label}</h2>
          {!inline && onClose && (
            <button onClick={onClose} className="hidden rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white sm:block" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {tab === "profile" && <ProfileTab />}
        {tab === "security" && <SecurityTab accounts={accounts} reload={loadAccounts} />}
        {tab === "danger" && <DangerTab accounts={accounts} />}
        <button
          onClick={async () => { await signOut(); window.location.href = "/"; }}
          className={`${btnGhost} mt-2 flex items-center gap-2 sm:hidden`}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  if (inline) return panel;
  // Portal to <body>: the sticky header's backdrop blur would otherwise trap
  // this fixed overlay inside the header.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm sm:p-6" onClick={onClose}>
      {panel}
    </div>,
    document.body,
  );
}
