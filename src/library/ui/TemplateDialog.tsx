import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import { toast } from "sonner";
import { Copy, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { FONTS, MOTIONS, type Brand } from "../brand";
import type { Template } from "../kit";
import { aspectLabel, seconds } from "../registry";
import { LivePlayer } from "./LivePlayer";
import { FREE_COPIES, SignUpGate, copiesUsed, countCopy, hasEmailSignup } from "./SignUpGate";
import { track } from "@/app/lib/analytics";

type Props = {
  template: Template | null;
  brand: Brand;
  content: Record<string, string | number>;
  onContent: (c: Record<string, string | number>) => void;
  onClose: () => void;
};

// A ready-to-paste prompt that describes this template in the viewer's brand
// kit and copy, for making the video with Claude and Remotion.
function buildPrompt(t: Template, brand: Brand, content: Record<string, string | number>) {
  const copyLines = t.fields
    .map((f) => {
      const v = content[f.key] ?? t.defaults[f.key];
      return v === undefined || v === "" ? null : `- ${f.label}: ${v}`;
    })
    .filter(Boolean);
  return [
    `Create a ${seconds(t)}-second ${aspectLabel(t)} motion graphic video (${t.width}x${t.height}, ${t.fps} fps) with Remotion: "${t.title}".`,
    "",
    `What it shows: ${t.outcome}.`,
    `Style tags: ${t.tags.join(", ")}.`,
    "",
    "Brand kit (use only these, never hard-code other colours or fonts):",
    `- Brand name: ${brand.name}`,
    `- Background: ${brand.background}`,
    `- Text: ${brand.foreground}`,
    `- Primary: ${brand.primary}`,
    `- Accent: ${brand.accent}`,
    `- Font: ${FONTS[brand.font].label}`,
    `- Motion feel: ${MOTIONS[brand.motion].label}`,
    ...(copyLines.length ? ["", "On-screen copy:", ...copyLines] : []),
    "",
    "Make every frame a pure function of time so it renders the same every time. End on the brand name. Add a soundtrack whose hits land on the cuts.",
  ].join("\n");
}

const inputCls =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#22A03A]";

export function TemplateDialog({ template: t, brand, content, onContent, onClose }: Props) {
  const { isSignedIn: accountSignedIn } = useAuth();
  const [emailSignup, setEmailSignup] = useState(hasEmailSignup);
  const isSignedIn = !!accountSignedIn || emailSignup;
  const [gate, setGate] = useState(false);
  const [used, setUsed] = useState(copiesUsed);

  // Close the gate once the sign-up completes.
  useEffect(() => {
    if (isSignedIn && gate) {
      setGate(false);
      track("signup_completed", { source: "prompt_gate" });
      toast.success("You're in", { description: "Copy as many prompts as you like." });
    }
  }, [isSignedIn, gate]);

  const copy = async () => {
    if (!t) return;
    if (!isSignedIn && used >= FREE_COPIES) {
      setGate(true);
      track("signup_gate_shown", { template: t.id });
      return;
    }
    try {
      await navigator.clipboard.writeText(buildPrompt(t, brand, content));
      if (!isSignedIn) {
        countCopy();
        setUsed((n) => n + 1);
      }
      track("prompt_copied", { template: t.id });
      toast.success("Prompt copied", { description: "Paste it into Claude to make this video in your brand." });
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  return (
    <Dialog open={!!t} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto border-white/12 bg-[#080808] p-0 text-white sm:max-w-[1180px]">
        {gate && !isSignedIn && <SignUpGate onClose={() => setGate(false)} onEmailSignup={() => setEmailSignup(true)} />}
        {t && (
          <div className="grid lg:grid-cols-[1fr_340px]">
            <div className="border-b border-white/10 p-4 sm:p-6 lg:border-r lg:border-b-0">
              <LivePlayer
                key={t.id}
                template={t}
                brand={brand}
                content={content}
                controls
                className="h-[min(62vh,560px)] w-full rounded-xl"
              />
            </div>
            <div className="flex flex-col p-5 sm:p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#22A03A]">{t.category}</div>
              <DialogTitle className="mt-2 text-[22px] font-semibold tracking-tight">{t.title}</DialogTitle>
              <DialogDescription className="mt-1.5 text-[14px] leading-relaxed text-white/60">{t.outcome}</DialogDescription>
              <div className="mt-3 flex gap-2 text-[12px] text-white/50">
                <span className="rounded-full border border-white/12 px-2.5 py-0.5">{aspectLabel(t)}</span>
                <span className="rounded-full border border-white/12 px-2.5 py-0.5">{seconds(t)}s</span>
                <span className="rounded-full border border-white/12 px-2.5 py-0.5">{t.fps} fps</span>
              </div>

              <div className="mt-6 space-y-4">
                {t.fields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-white/70">{f.label}</span>
                    {f.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={String(content[f.key] ?? "")}
                        onChange={(e) => onContent({ ...content, [f.key]: e.target.value })}
                        className={`${inputCls} resize-none`}
                      />
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        value={String(content[f.key] ?? "")}
                        onChange={(e) =>
                          onContent({
                            ...content,
                            [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                          })
                        }
                        className={inputCls}
                      />
                    )}
                    {f.hint && <span className="mt-1 block text-[11px] text-white/40">{f.hint}</span>}
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2 pt-2 lg:mt-auto">
                <div className="flex gap-2">
                  <button
                    onClick={copy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#22A03A] px-5 py-2.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    <Copy className="h-4 w-4" /> Copy prompt
                  </button>
                  <button
                    onClick={() => onContent({ ...(t.defaults as Record<string, string | number>) })}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] text-white/80 transition-colors hover:border-white/40 hover:text-white"
                    title="Reset fields"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </button>
                </div>
                {!isSignedIn && (
                  <p className="text-center text-[11px] text-white/40">
                    {used < FREE_COPIES ? `${FREE_COPIES - used} free prompt ${FREE_COPIES - used === 1 ? "copy" : "copies"} left, then sign up free` : "Sign up free for unlimited prompt copies"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
