import { useEffect, useState } from "react";
import { AuthForm, authErrorMessage } from "@/app/lib/auth";
import { Link, useSearchParams } from "react-router";
import goblinLogo from "@/assets/goblin-logo.png";
import { GeckoMark } from "@/app/components/ui/gecko-mark";

export default function Login() {
  const [params] = useSearchParams();
  // Only same-site paths, so ?redirect= can't bounce people to another site.
  const raw = params.get("redirect") ?? "/";
  const redirect = raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/";
  const mode = params.get("mode") === "sign-up" ? "sign-up" : "sign-in";
  // A failed or cancelled Google sign-in lands here with ?error=<code>
  // (onAPIError.errorURL / errorCallbackURL). Show it, then tidy the URL.
  const oauthError = authErrorMessage(params.get("error"));
  useEffect(() => {
    if (!params.get("error")) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [params]);

  const [shown, setShown] = useState(mode);
  const signUp = shown === "sign-up";
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white">
      {/* The chat's soft green glow */}
      <div aria-hidden className="pointer-events-none absolute -top-56 left-1/2 h-[460px] w-[980px] max-w-[160%] -translate-x-1/2 rounded-[50%] blur-[110px]" style={{ background: "radial-gradient(closest-side, #22A03A33, transparent)" }} />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={goblinLogo} alt="" className="h-8 w-8 rounded-lg" />
          <span className="text-[16px] font-semibold tracking-tight">Goblin</span>
        </Link>
        <Link to="/" className="text-[13px] text-white/50 transition-colors hover:text-white">
          Back to Goblin
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-[400px] flex-col justify-center px-5 pb-16">
        <GeckoMark label="" className="mb-5 h-14 w-14" />
        <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.02em]">{signUp ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1.5 mb-7 text-[14.5px] text-white/55">{signUp ? "Free, and it takes a few seconds." : "Sign in to keep making launch videos."}</p>
        <AuthForm
          tone="dark"
          initialMode={mode}
          callbackURL={redirect}
          initialError={oauthError}
          onModeChange={setShown}
          onDone={() => {
            window.location.href = redirect;
          }}
        />
        <p className="mt-8 text-center text-[12px] leading-relaxed text-white/35">
          By continuing you agree to the{" "}
          <Link to="/terms" className="underline decoration-white/20 underline-offset-2 hover:text-white/60">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline decoration-white/20 underline-offset-2 hover:text-white/60">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
