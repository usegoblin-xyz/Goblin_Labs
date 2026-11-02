import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import goblinLogo from "@/assets/goblin-logo.png";
import { openCookieSettings } from "@/app/lib/CookieBanner";

const UPDATED = "November 2, 2026";
const CONTACT = "obi@usegoblin.xyz";

function Shell({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Goblin`;
    window.scrollTo(0, 0);
  }, [title]);
  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header className="border-b border-white/8">
        <div className="mx-auto flex h-14 max-w-[760px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={goblinLogo} alt="" className="h-7 w-7 rounded-md" />
            <span className="text-[15px] font-semibold tracking-tight">Goblin</span>
          </Link>
          <Link to="/" className="text-[13px] text-white/65 hover:text-white">
            Back to library
          </Link>
        </div>
      </header>
      <main className="legal mx-auto max-w-[760px] px-4 py-12 sm:px-6">
        <h1 className="text-[32px] font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-[13px] text-white/60">Last updated {UPDATED}</p>
        <div className="mt-10 space-y-8 text-[15px] leading-[1.7] text-white/80 [&_a]:text-[#5fd67a] [&_a]:underline [&_h2]:mb-3 [&_h2]:text-[19px] [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:mt-2 [&_ul]:space-y-1.5 [&_p+p]:mt-3 [&_ul+p]:mt-4 [&_div+p]:mt-4 [&_table+p]:mt-4 [&_td]:border-t [&_td]:border-white/10 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_th]:pb-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-white">
          {children}
        </div>
        <p className="mt-14 border-t border-white/10 pt-6 text-[13px] text-white/60">
          GoblinLabs Inc., a Delaware corporation · <a href={`mailto:${CONTACT}`} className="text-[#5fd67a] underline">{CONTACT}</a>
        </p>
      </main>
    </div>
  );
}

export function Privacy() {
  return (
    <Shell title="Privacy Policy">
      <section>
        <p>
          This policy explains what personal information GoblinLabs Inc. ("Goblin", "we", "us") collects when you use
          usegoblin.xyz (the "Service"), why, who we share it with, and the choices you have. We collect only what we need
          to run the Service. We do not sell your personal information.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your email address, a display name, and your password (stored only as a secure hash). If you sign in with Google, we receive your name, email address and profile photo from Google.</li>
          <li><strong>Session and security data:</strong> your IP address and browser type for each signed-in session, used to keep you signed in, show your active devices and protect against abuse (for example, rate limiting sign-in attempts).</li>
          <li><strong>Newsletter sign-ups:</strong> your email address, the page you signed up from, and any campaign tags in the link you followed.</li>
          <li><strong>Usage analytics:</strong> pages viewed, templates opened, prompts copied and similar product events, with device type and approximate location derived from your IP address. See <a href="#cookies">Cookies</a> for how consent works.</li>
          <li><strong>Stored in your browser, not on our servers:</strong> your brand kit (name, colours, font, motion feel), saved templates, edited template copy and the count of free prompt copies.</li>
          <li><strong>Messages you send us,</strong> such as email replies.</li>
        </ul>
        <p>We do not collect payment information, and we do not ask for sensitive information such as health, financial or government ID data.</p>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To provide the Service: create and secure your account, keep you signed in, and unlock unlimited prompt copies.</li>
          <li>To send account emails you need, such as confirming a change of email address.</li>
          <li>To send the Goblin newsletter, only if you subscribe. Every newsletter has an unsubscribe link.</li>
          <li>To understand how the Service is used and improve it.</li>
          <li>To prevent fraud and abuse and to comply with the law.</li>
        </ul>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>We share personal information only with service providers that run parts of the Service for us, under contracts that limit their use of it:</p>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full text-[14px]">
            <thead><tr><th>Provider</th><th>What it does for Goblin</th></tr></thead>
            <tbody>
              <tr><td>Vercel</td><td>Hosts the website and servers</td></tr>
              <tr><td>Supabase</td><td>Database for accounts, sessions and newsletter sign-ups (United States)</td></tr>
              <tr><td>Better Auth</td><td>Sign-in software and its security monitoring service</td></tr>
              <tr><td>Google</td><td>"Continue with Google" sign-in, if you choose it</td></tr>
              <tr><td>PostHog</td><td>Product analytics (US Cloud)</td></tr>
              <tr><td>Resend</td><td>Sends account emails</td></tr>
              <tr><td>Substack</td><td>Hosts and sends the newsletter</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          When you paste a Goblin prompt into Claude or another AI tool, you send it to that provider yourself, under its own
          terms and privacy policy. Goblin does not send your content to any AI provider. We may also disclose information if
          the law requires it, or as part of a merger or sale of the company, in which case this policy continues to apply.
        </p>
      </section>

      <section id="cookies">
        <h2>Cookies and similar technologies</h2>
        <table className="mt-1 w-full text-[14px]">
          <thead><tr><th>Type</th><th>What and why</th></tr></thead>
          <tbody>
            <tr><td>Essential</td><td>A sign-in session cookie that keeps you logged in, and a record of your cookie choice. These are needed for the Service to work and are always on.</td></tr>
            <tr><td>Browser storage</td><td>Your brand kit, saved templates and free-copy count, kept in your browser's local storage so they work without an account.</td></tr>
            <tr><td>Analytics</td><td>PostHog cookies and local storage that recognise a returning browser. Set only if you click Accept on the cookie banner. If you decline or haven't chosen, PostHog runs in cookieless mode: it records anonymous page and product events without storing anything on your device.</td></tr>
          </tbody>
        </table>
        <p>
          We do not use advertising cookies. You can change your choice at any time:{" "}
          <button type="button" onClick={openCookieSettings} className="text-[#5fd67a] underline">open cookie settings</button>.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          Account data is kept until you delete your account. Session records expire after they are no longer active.
          Newsletter sign-ups are kept until you unsubscribe or ask us to delete them. Analytics events are kept for as long as
          they are useful for improving the Service, up to the retention period of our analytics provider.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <ul>
          <li><strong>Delete your account</strong> from your account page (click your profile picture, then Delete account). This removes your account, sign-in methods, sessions and newsletter sign-up.</li>
          <li><strong>Access, correct or delete</strong> other information, including analytics linked to you, by emailing <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. We respond within 30 days.</li>
          <li><strong>Unsubscribe</strong> from the newsletter with the link in any issue.</li>
          <li><strong>Decline analytics cookies</strong> in cookie settings.</li>
        </ul>
        <p>
          Depending on where you live (for example the EU, UK or California), you may have additional rights, such as data
          portability or objecting to processing, and the right to complain to your local data protection authority. Contact us
          to exercise them; we will not treat you differently for doing so.
        </p>
      </section>

      <section>
        <h2>Security and international transfers</h2>
        <p>
          We use encryption in transit, hashed passwords, rate limiting and access controls. No system is perfectly secure, so
          please use a strong, unique password. Goblin is run from the United States, and your information is processed there.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Goblin is not intended for anyone under 13, and we do not knowingly collect information from children under 13. If you
          believe a child has given us personal information, email us and we will delete it.
        </p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p>
          If we make material changes to this policy, we will update the date above and, where appropriate, tell you by email or
          on the site. Questions or requests: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </section>
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms of Service">
      <section>
        <p>
          These terms are an agreement between you and GoblinLabs Inc. ("Goblin", "we", "us") for your use of usegoblin.xyz and
          its templates, prompts and related services (the "Service"). By using the Service you agree to them. If you use the
          Service for a company, you agree on its behalf.
        </p>
      </section>

      <section>
        <h2>Who can use Goblin</h2>
        <p>
          You must be at least 13 years old. If you are under the age of majority where you live, you may use Goblin only with a
          parent or guardian's permission. You are responsible for your account, for keeping your password secure, and for
          activity under your account.
        </p>
      </section>

      <section>
        <h2>The Service</h2>
        <p>
          Goblin provides motion templates you can preview in your brand and prompts you can copy into an AI tool, such as
          Claude, to produce a video. You can copy two prompts without an account; signing up unlocks unlimited copies. We may
          add, change or remove templates and features, and may set reasonable usage limits.
        </p>
      </section>

      <section>
        <h2>Your license to use templates</h2>
        <p>
          The templates, prompts, soundtracks and site are owned by GoblinLabs and protected by copyright. Subject to these terms,
          we give you a non-exclusive, worldwide, royalty-free license to use the templates and prompts to create videos, and to
          use, publish and monetise the videos you create, for personal and commercial purposes, including marketing your own
          products.
        </p>
        <p>You may not:</p>
        <ul>
          <li>resell, redistribute or sublicense the templates or prompts themselves, alone or as part of a template library, prompt pack or competing product;</li>
          <li>scrape, bulk-download or copy the library;</li>
          <li>remove notices or misrepresent the templates as your own original work outside the videos you make with them.</li>
        </ul>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          Your brand name, colours, copy, logos and other material you add ("Your Content") stay yours. You confirm you have the
          right to use Your Content, including any trademarks or images. Most of Your Content stays in your browser; to the
          extent it reaches our servers, you let us process it only to provide the Service.
        </p>
      </section>

      <section>
        <h2>Third-party tools</h2>
        <p>
          Goblin prompts are used in tools we do not control, such as Claude, and the videos they produce are built with
          Remotion. Your use of those tools is governed by their own terms. Remotion's license is free for individuals and small
          companies, but larger companies may need a paid Remotion company license to render videos; please check it applies to
          you. AI tools can produce different or imperfect results, so review every video before you publish it.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>Don't use Goblin to make content that is illegal, infringing, deceptive, hateful or harassing; to impersonate others; to break or overload the Service; or to get around usage limits or security.</p>
      </section>

      <section>
        <h2>Fees and refunds</h2>
        <p>
          Goblin is currently free. If we introduce paid features, we will show the price and what you get before you pay, and
          the refund terms will be stated at the point of purchase. There are no hidden fees, and we will never charge you
          without your explicit agreement.
        </p>
      </section>

      <section>
        <h2>Ending your use</h2>
        <p>
          You can stop using Goblin and delete your account at any time. We may suspend or end access if you break these terms or
          to protect the Service or others. Sections that by nature should survive (licenses for videos already made,
          ownership, disclaimers, limits of liability) continue after termination.
        </p>
      </section>

      <section>
        <h2>Disclaimers and limitation of liability</h2>
        <p>
          The Service is provided "as is" and "as available", without warranties of any kind, to the extent the law allows. To
          the extent the law allows, GoblinLabs will not be liable for indirect, incidental, special, consequential or punitive
          damages, or lost profits or data, and our total liability for any claim relating to the Service is limited to the
          greater of the amount you paid us in the 12 months before the claim or US$100. Some places don't allow these limits, so
          they may not apply to you.
        </p>
      </section>

      <section>
        <h2>Governing law and changes</h2>
        <p>
          These terms are governed by the laws of the State of Delaware, without regard to its conflict of law rules. If we change
          these terms materially, we will update the date above and give notice on the site or by email; continuing to use the
          Service after that means you accept the changes. Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </section>
    </Shell>
  );
}
