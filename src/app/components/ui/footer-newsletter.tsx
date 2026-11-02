// Site footer, adapted from the "Footer with newsletter" block: a newsletter
// card on top, a brand column plus link columns, and a bottom bar with the
// legal links. Plain anchors (Vite + React Router, not Next.js) and only real
// destinations.
import type { ReactNode } from "react";
import { Linkedin, Newspaper } from "lucide-react";
import goblinLogo from "@/assets/goblin-logo.png";

export type FooterLink = { label: string; href?: string; onClick?: () => void; external?: boolean };
export type FooterColumn = { title: string; links: FooterLink[] };

const XLogo = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SOCIALS = [
  { label: "Goblin on X", href: "https://x.com/UseGoblin", icon: <XLogo /> },
  { label: "Goblin on LinkedIn", href: "https://www.linkedin.com/company/goblinlabs1/", icon: <Linkedin className="h-[18px] w-[18px]" /> },
  { label: "Goblin newsletter", href: "https://goblinlabs.substack.com", icon: <Newspaper className="h-[18px] w-[18px]" /> },
];

function FooterAnchor({ link, className }: { link: FooterLink; className: string }) {
  if (link.onClick && !link.href)
    return (
      <button type="button" onClick={link.onClick} className={`${className} text-left font-normal`}>
        {link.label}
      </button>
    );
  return (
    <a
      href={link.href}
      onClick={link.onClick}
      className={className}
      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {link.label}
    </a>
  );
}

export default function FooterNewsletter({
  newsletter,
  aside,
  columns,
  legal,
  tagline,
  copyright,
}: {
  newsletter: ReactNode;
  aside?: ReactNode;
  columns: FooterColumn[];
  legal: FooterLink[];
  tagline: string;
  copyright: ReactNode;
}) {
  return (
    <footer className="relative w-full overflow-hidden border-t border-white/8 bg-black pt-16 pb-10 text-white">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-[#22A03A] opacity-[0.07] blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-[#22A03A] opacity-[0.06] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1240px] px-4 sm:px-6">
        {/* Newsletter card */}
        <div className="mb-14 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>{newsletter}</div>
            {aside && <div className="hidden justify-end md:flex">{aside}</div>}
          </div>
        </div>

        {/* Brand + link columns */}
        <div className="mb-14 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <a href="/" className="mb-5 flex items-center gap-2.5">
              <img src={goblinLogo} alt="" className="h-9 w-9 rounded-lg" />
              <span className="text-[20px] font-bold tracking-tight">Goblin</span>
            </a>
            <p className="mb-6 max-w-xs text-[14px] leading-relaxed text-white/60">{tagline}</p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/75 transition hover:border-[#22A03A]/50 hover:bg-[#22A03A]/10 hover:text-white"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[14px] font-semibold text-white">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterAnchor link={l} className="text-[14px] text-white/60 transition hover:text-white" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-center text-[13px] text-white/60 md:text-left">{copyright}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {legal.map((l) => (
              <FooterAnchor key={l.label} link={l} className="text-[13px] text-white/60 transition hover:text-white" />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
