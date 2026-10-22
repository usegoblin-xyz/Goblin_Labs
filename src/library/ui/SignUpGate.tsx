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

const appearance = {
  variables: {
    colorPrimary: "#22a03a",
    colorTextOnPrimaryBackground: "#ffffff",
    colorBackground: "#ffffff",
    colorInputBackground: "#f4f6f3",
    colorInputText: "#0d1512",
    colorText: "#0d1512",
    colorTextSecondary: "#6b7669",
    borderRadius: "0.75rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "bg-transparent shadow-none border-0 p-0 w-full",
    header: "hidden",
    formFieldInput: "h-11 rounded-xl !border-[#e7e6e1] !bg-[#f4f6f3] focus:!border-[#22a03a]",
    formButtonPrimary: "h-11 rounded-xl !bg-[#22a03a] hover:!bg-[#178a2e] !text-white !font-bold normal-case tracking-normal !shadow-none",
    footer: "hidden",
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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-full w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white p-6 text-[#0d1512] shadow-2xl sm:p-7">
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1 text-[#6b7669] hover:bg-black/5" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <img src="/favicon-192.png" alt="" className="h-10 w-10 rounded-xl" />
        <h3 className="mt-4 text-[22px] font-extrabold tracking-tight">Sign up to keep copying</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#6b7669]">
          You've used your {FREE_COPIES} free prompts. Sign up with your email for unlimited prompt copies. It's free.
        </p>
        <div className="mt-5">
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
                className="h-11 w-full rounded-xl border border-[#e7e6e1] bg-[#f4f6f3] px-3 text-[14px] outline-none focus:border-[#22a03a]"
              />
              {error && <p className="text-[12px] text-[#c0392b]">{error}</p>}
              <button disabled={sending} className="h-11 w-full rounded-xl bg-[#22a03a] text-[14px] font-bold text-white hover:bg-[#178a2e] disabled:opacity-60">
                {sending ? "Signing up…" : "Sign up with email"}
              </button>
            </form>
          ) : (
            <div className="h-24 animate-pulse rounded-xl bg-[#f4f6f3]" />
          )}
        </div>
      </div>
    </div>
  );
}
