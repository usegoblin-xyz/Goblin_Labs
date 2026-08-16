import { SignIn } from "@clerk/clerk-react";
import { Link, useSearchParams } from "react-router";

// Clerk appearance tuned to the new light look: white ground, goblin-green
// primary, soft sage inputs, Inter for UI. Card chrome stripped so the form
// sits flush on our own panel.
const appearance = {
  variables: {
    colorPrimary: "#22a03a",
    colorTextOnPrimaryBackground: "#ffffff",
    colorBackground: "#ffffff",
    colorInputBackground: "#f4f6f3",
    colorInputText: "#0d1512",
    colorText: "#0d1512",
    colorTextSecondary: "#6b7669",
    colorDanger: "#c0392b",
    borderRadius: "0.75rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    card: "bg-transparent shadow-none border-0 p-0 w-full",
    headerTitle:
      "!text-[28px] !font-extrabold !tracking-tight !text-[#0d1512] text-left",
    headerSubtitle: "!text-[14px] !text-[#6b7669] text-left",
    socialButtonsBlockButton:
      "h-12 rounded-xl border !border-[#e7e6e1] !bg-white !text-[#0d1512] hover:!bg-[#fafaf8] !shadow-none",
    socialButtonsBlockButtonText: "!text-[#0d1512] !font-semibold",
    dividerLine: "!bg-[#e7e6e1]",
    dividerText: "!text-[#6b7669]",
    formFieldLabel: "!text-[13px] !font-semibold !text-[#0d1512]",
    formFieldInput:
      "h-12 rounded-xl !border-[#e7e6e1] !bg-[#f4f6f3] focus:!border-[#22a03a] focus:!ring-[#22a03a]/20",
    formButtonPrimary:
      "h-12 rounded-xl !bg-[#22a03a] hover:!bg-[#178a2e] !text-white !font-bold !text-[14px] !shadow-none normal-case tracking-normal",
    buttonArrowIcon: "!text-white",
    footerActionText: "!text-[#6b7669]",
    footerActionLink: "!text-[#22a03a] hover:!text-[#178a2e] !font-semibold",
    identityPreviewEditButton: "!text-[#22a03a]",
    formFieldAction: "!text-[#22a03a] hover:!text-[#178a2e]",
  },
} as const;

export default function Login() {
  const [params] = useSearchParams();
  const redirect = params.get("redirect") ?? "/studio";

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
          <SignIn
            routing="path"
            path="/login"
            forceRedirectUrl={redirect}
            signUpForceRedirectUrl={redirect}
            appearance={appearance}
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
