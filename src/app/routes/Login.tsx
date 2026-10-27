import { useEffect } from "react";
import { AuthForm, authErrorMessage } from "@/app/lib/auth";
import { Link, useSearchParams } from "react-router";

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

  return (
    <div className="grid min-h-screen w-full bg-white text-[#0d1512] lg:grid-cols-2">
      {/* ---------- LEFT: form ---------- */}
      <section className="relative flex flex-col px-6 py-6 sm:px-12">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/favicon-192.png"
              alt=""
              className="h-[34px] w-[34px] rounded-lg"
            />
            <span className="text-[17px] font-bold tracking-tight">
              Goblin Labs
            </span>
          </Link>
          <Link
            to="/"
            className="text-[11px] uppercase tracking-[0.18em] text-[#6b7669] hover:text-[#0d1512]"
          >
            Back to lab
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-16">
          <h1 className="text-[28px] font-extrabold tracking-tight">{mode === "sign-up" ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 mb-7 text-[14px] text-[#6b7669]">{mode === "sign-up" ? "Free, and it takes a few seconds." : "Sign in to Goblin."}</p>
          <AuthForm
            tone="light"
            initialMode={mode}
            callbackURL={redirect}
            initialError={oauthError}
            onDone={() => {
              window.location.href = redirect;
            }}
          />

          <p className="mt-8 text-center text-[11px] leading-relaxed text-[#9aa295]">
            Visitors talking to your deployed personas never need an account.
            This sign-in is for builders.
          </p>
        </main>
      </section>

      {/* ---------- RIGHT: Mia, halved, no text ---------- */}
      <aside className="relative hidden overflow-hidden bg-white lg:block">
        <img
          src="/auth/mia.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
      </aside>
    </div>
  );
}
