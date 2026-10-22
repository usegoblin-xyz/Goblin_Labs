import { useEffect, useState } from "react";
import { SignUp, useClerk } from "@clerk/clerk-react";
import { X } from "lucide-react";
import { captureContact } from "@/app/lib/leads";

// Free prompt copies before an email sign-up is required. The third copy opens
// the gate; signed-in users copy without limit.
export const FREE_COPIES = 2;
const KEY = "goblin.promptCopies";
const EMAIL_KEY = "goblin.signupEmail";

// Set when someone signed up through the email fallback (Clerk unavailable).
export function hasEmailSignup(): boolean {
  try {
    return !!localStorage.getItem(EMAIL_KEY);
  } catch {
    return false;
  }
}

export function copiesUsed(): number {
  try {
    return Number(localStorage.getItem(KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

export function countCopy() {
  try {
    localStorage.setItem(KEY, String(copiesUsed() + 1));
  } catch {
    /* storage blocked: the gate still opens from the in-memory count */
  }
}

// Dark, compact Clerk sign-up: no card, header, name fields or footer, so the
// whole form fits in the modal without scrolling.
const appearance = {
  variables: {
    colorPrimary: "#22a03a",
    colorTextOnPrimaryBackground: "#ffffff",
    colorBackground: "#0a0a0a",
    colorInputBackground: "#151515",
    colorInputText: "#f5f5f2",
    colorText: "#f5f5f2",
    colorTextSecondary: "#9a9a96",
    colorNeutral: "#f5f5f2",
    colorDanger: "#ff6b5e",
    borderRadius: "0.75rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    rootBox: "!w-full",
    cardBox: "!w-full !max-w-none !shadow-none !border-0 !rounded-none !bg-transparent",
    card: "!bg-transparent !shadow-none !border-0 !p-0 !gap-4 !w-full",
    header: "!hidden",
    logoBox: "!hidden",
    footer: "!hidden",
    formFieldRow__name: "!hidden",
    socialButtonsBlockButton: "!h-11 !rounded-xl !border-white/15 !bg-white/[0.04] hover:!bg-white/[0.08] !shadow-none",
    socialButtonsBlockButtonText: "!text-[#f5f5f2] !font-semibold",
    dividerLine: "!bg-white/12",
    dividerText: "!text-white/40",
    formFieldLabel: "!text-[13px] !font-medium !text-white/75",
    formFieldInput: "!h-11 !rounded-xl !border-white/12 !bg-white/[0.05] !text-white focus:!border-[#22a03a]",
    formButtonPrimary: "!h-11 !rounded-xl !bg-[#22a03a] hover:!bg-[#1c8a31] !text-white !font-bold !normal-case !tracking-normal !shadow-none",
    formFieldAction: "!text-[#5fd67a]",
    identityPreviewEditButton: "!text-[#5fd67a]",
    otpCodeFieldInput: "!border-white/20 !text-white",
  },
} as const;

// Overlay shown inside the template dialog: Clerk's email sign-up, rendered
// inline so it works within the dialog's focus trap.
export function SignUpGate({ onClose, onEmailSignup }: { onClose: () => void; onEmailSignup: () => void }) {
  const { loaded } = useClerk();
  // If Clerk hasn't loaded after a few seconds, fall back to a plain email form.
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (loaded) return;
    const id = setTimeout(() => setFallback(true), 4000);
    return () => clearTimeout(id);
  }, [loaded]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Enter a valid email address.");
    setSending(true);
    setError("");
    try {
      await captureContact("motion-signup", { email, need: "Prompt copy sign-up" });
      try {
        localStorage.setItem(EMAIL_KEY, email);
      } catch {
        /* storage blocked: unlocked for this visit only */
      }
      onEmailSignup();
    } catch {
      setError("Something went wrong. Try again in a moment.");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[400px] rounded-2xl border border-white/12 bg-[#0a0a0a] p-6 text-[#f5f5f2] shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <img src="/favicon-192.png" alt="" className="h-9 w-9 rounded-lg" />
        <h3 className="mt-3 text-[20px] font-bold tracking-tight">Sign up to keep copying</h3>
        <p className="mt-1 text-[13.5px] leading-relaxed text-white/55">
          You've used your {FREE_COPIES} free prompts. Sign up with your email for unlimited prompt copies. It's free.
        </p>
        <div className="mt-4">
          {loaded ? (
            <SignUp routing="virtual" appearance={appearance} signInUrl="/login" />
          ) : fallback ? (
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoFocus
                className="h-11 w-full rounded-xl border border-white/12 bg-white/[0.05] px-3 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#22a03a]"
              />
              {error && <p className="text-[12px] text-[#ff6b5e]">{error}</p>}
              <button disabled={sending} className="h-11 w-full rounded-xl bg-[#22a03a] text-[14px] font-bold text-white hover:bg-[#178a2e] disabled:opacity-60">
                {sending ? "Signing up…" : "Sign up with email"}
              </button>
            </form>
          ) : (
            <div className="h-24 animate-pulse rounded-xl bg-white/[0.05]" />
          )}
        </div>
        <p className="mt-4 text-center text-[12.5px] text-white/45">
          Already have an account?{" "}
          <a href="/login?redirect=/" className="font-semibold text-[#5fd67a] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
