import { X } from "lucide-react";
import { AuthForm } from "@/app/lib/auth";

// Free prompt copies before an email sign-up is required. The third copy opens
// the gate; signed-in users copy without limit.
export const FREE_COPIES = 2;
const KEY = "goblin.promptCopies";
const EMAIL_KEY = "goblin.signupEmail";

// Set by the old email-only fallback; those visitors stay unlocked.
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

// Overlay shown inside the template dialog: Better Auth email + Google sign-up,
// compact enough to fit without scrolling. Signing in also unlocks copying.
export function SignUpGate({ onClose }: { onClose: () => void; onEmailSignup?: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[400px] rounded-2xl border border-white/12 bg-[#0a0a0a] p-6 text-[#f5f5f2] shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <img src="/favicon-192.png" alt="" className="h-9 w-9 rounded-lg" />
        <h3 className="mt-3 text-[20px] font-bold tracking-tight">Sign up to keep copying</h3>
        <p className="mt-1 mb-5 text-[13.5px] leading-relaxed text-white/55">
          You've used your {FREE_COPIES} free prompts. Sign up with your email for unlimited prompt copies. It's free.
        </p>
        <AuthForm tone="dark" initialMode="sign-up" />
      </div>
    </div>
  );
}
