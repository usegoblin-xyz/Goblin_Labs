import { useState } from "react";
import { Link } from "react-router";

// Plain-language docs. Short sentences, no jargon. This page is the answer to
// "what is this?" for launch-week visitors, so it must read in two minutes.

const EMBED_SNIPPET = `<!-- An inline window: the persona lives right in your page.
     Replace PERSONA_ID with your persona's id (the part after
     /embed/ in its link, or copy it from your account page). -->
<iframe
  src="https://www.usegoblin.xyz/embed/PERSONA_ID"
  allow="camera; microphone; autoplay; clipboard-write"
  style="width:100%;max-width:420px;height:640px;border:0;border-radius:16px;"
  title="Talk to our persona"
></iframe>`;

const SCRIPT_SNIPPET = `<!-- A floating button in the corner of every page.
     Click it and the persona opens in a small window. -->
<script
  src="https://www.usegoblin.xyz/embed.js"
  data-persona="PERSONA_ID"
  data-label="Ask us"
  defer
></script>`;

const BUTTON_SNIPPET = `<!-- A simple link that opens the persona on its own page -->
<a href="https://www.usegoblin.xyz/p/PERSONA_ID" target="_blank" rel="noopener"
   style="display:inline-block;padding:12px 24px;border-radius:10px;
          background:#22a03a;color:#fff;font-weight:600;text-decoration:none;">
  Talk to us
</a>`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative my-4 rounded-xl border border-border/60 bg-[#111111]">
      <button
        onClick={() => {
          navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="absolute right-3 top-3 rounded-md border border-border/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-4 pr-20 text-[12.5px] leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 text-[1.35rem] font-semibold tracking-tight">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 text-[1.05rem] font-semibold tracking-tight">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">{children}</p>;
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">{q}</span> {a}
    </p>
  );
}

export default function Docs() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="text-[14px] font-semibold tracking-tight">
          Goblin Labs
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/studio" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
            Studio
          </Link>
          <Link to="/" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
            Back to lab
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[680px] px-6 pb-24 pt-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Docs</div>
        <h1 className="mt-3 text-[2rem] leading-tight tracking-tight">
          What Goblin Labs does, <span className="font-serif-italic">in plain words.</span>
        </h1>

        <P>
          Goblin Labs puts a talking person on your website. We call it a persona. It has a face
          and a voice. Visitors talk to it the same way they would talk to a person at a front
          desk. It answers questions about your business, collects contact details, and books
          meetings while you do other things.
        </P>
        <P>
          It is not a chatbot. A chatbot is a text box with canned replies. A persona looks at
          your visitor, listens, and speaks. People stay longer because it feels like talking to
          someone, not typing at something.
        </P>

        <H2>What a persona can do</H2>
        <QA q="Greet and answer." a="It welcomes visitors and answers questions about your business using the information you give it." />
        <QA q="Collect leads." a="When a visitor is interested, the persona asks for their name and email and saves it for you." />
        <QA q="Book meetings." a="It can put a meeting on your calendar during the conversation. The visitor never fills a form or waits for a reply." />
        <QA q="Handle support." a="A support persona answers common questions and opens a ticket in your help desk when it cannot solve something itself." />

        <H2>How to make one</H2>
        <QA q="Step 1. Give it a face." a="Pick one of our faces or upload a photo. A custom face takes a minute or two." />
        <QA q="Step 2. Give it a voice and a job." a={'Choose a voice, then tell it what to do in plain words. For example: "You help visitors learn about our clinic and book consultations."'} />
        <QA q="Step 3. Teach it your business." a="Paste your website address or your documents. The persona reads them and uses them to answer questions. It only knows what you give it." />
        <QA q="Step 4. Put it to work." a="Every persona gets its own link you can share anywhere. You can also place it on your own website with the code below." />
        <P>
          The whole thing takes about ten minutes in the{" "}
          <Link to="/studio" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
            studio
          </Link>
          . No account needed. If you would rather not do it yourself, email us your website
          address and we will build the first one for you.
        </P>

        <H2>Put a persona on your own site</H2>
        <P>
          Every persona has its own id: the part after /embed/ in its link. The
          easiest place to get it is your{" "}
          <Link to="/account" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
            account page
          </Link>
          , which lists each of your personas with the codes below already filled
          in and ready to copy. Pick whichever of these three fits your site.
          There is no install, no key, and no build step.
        </P>

        <H3>1. An inline window</H3>
        <P>
          Drops the persona straight into the page, ready to talk. Paste this
          where you want it to appear and replace PERSONA_ID with your id:
        </P>
        <CodeBlock code={EMBED_SNIPPET} />
        <P>
          This embed is clean: just the persona, with none of the Goblin Labs
          header or footer around it, so it looks like part of your own site.
        </P>

        <H3>2. A floating button</H3>
        <P>
          Adds a small button in the corner of every page. When a visitor clicks
          it, the persona opens in a little window over your site. It is one line
          and works anywhere you can add a script:
        </P>
        <CodeBlock code={SCRIPT_SNIPPET} />
        <P>
          Change the wording with data-label (for example
          data-label="Talk to sales"), move it to the left with
          data-position="left", or match your brand with
          data-accent="#22a03a".
        </P>

        <H3>3. A simple link</H3>
        <P>
          The lightest option: a button that opens the persona on its own page in
          a new tab. Good for emails, a link in your bio, or anywhere you cannot
          paste an HTML widget.
        </P>
        <CodeBlock code={BUTTON_SNIPPET} />

        <P>
          The camera and microphone permissions in the first two options let
          visitors talk to the persona from inside your page. Visitors never need
          an account. If you want the persona connected to your calendar, contact
          list, or help desk so it can book meetings and save leads for you,
          email us and we will set it up with you.
        </P>

        <H2>What it knows</H2>
        <P>
          Your persona answers from the material you give it: your website, your documents, and
          the instructions you write. You can change any of this at any time, and the change is
          live right away. If it says something wrong, fix it yourself in minutes or tell us and
          we will.
        </P>

        <H2>Common questions</H2>
        <QA q="How fast can it be live?" a="Within 48 hours of saying yes. Usually faster." />
        <QA q="Will it make things up?" a="It answers from your material. You review it before it goes live, like a new hire in their first week. If something slips through, you can fix it in minutes." />
        <QA q="Do my visitors need an account?" a="No. They just talk. Nobody needs an account right now, including you." />
        <QA q="What happens to visitor details?" a="Contact details your persona collects go to you. We do not sell them or use them for anything else." />
        <QA q="Can I see what it said?" a="Yes. You get a weekly note with the numbers: how many conversations, how many leads, how many meetings, and the question visitors asked most." />

        <H2>Talk to us</H2>
        <P>
          The fastest way to understand a persona is to talk to one. Try Mia or Gabriel on the{" "}
          <Link to="/" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
            homepage
          </Link>
          . For anything else, email obi@usegoblin.xyz. A human reads every message.
        </P>
      </main>
    </div>
  );
}
