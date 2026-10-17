import { useState } from "react";
import { toast } from "sonner";
import { Copy, Film, RotateCcw, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import type { Brand } from "../brand";
import type { Template } from "../kit";
import { aspectLabel, seconds } from "../registry";
import { buildPrompt, type AudioMode } from "../prompts";
import { LivePlayer } from "./LivePlayer";

type Props = {
  template: Template | null;
  brand: Brand;
  content: Record<string, string | number>;
  onContent: (c: Record<string, string | number>) => void;
  onClose: () => void;
  onWaitlist: () => void;
};

const inputCls =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#22A03A]";

const AUDIO: { key: AudioMode; label: string }[] = [
  { key: "off", label: "Silent" },
  { key: "subtle", label: "Effects" },
  { key: "music", label: "Music" },
];

export function TemplateDialog({ template: t, brand, content, onContent, onClose, onWaitlist }: Props) {
  const [audio, setAudio] = useState<AudioMode>("off");
  const prompt = t ? buildPrompt(t, brand, content, audio) : null;
  const copyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied", { description: "Filled with your brand kit and copy. Paste it into Claude or another AI tool." });
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };
  const copy = async () => {
    if (!t) return;
    const json = JSON.stringify({ template: t.id, brand, content }, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      toast.success("Props copied", { description: "Paste them into your Remotion project." });
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  return (
    <Dialog open={!!t} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto border-white/12 bg-[#080808] p-0 text-white sm:max-w-[1180px]">
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

              {prompt && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold">
                    <Sparkles className="h-4 w-4 text-[#22A03A]" /> AI prompt
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-white/50">
                    Build this video yourself with an AI tool. The prompt updates with your brand kit and fields.
                  </p>
                  <div className="mt-3 flex rounded-lg border border-white/12 p-0.5" role="radiogroup" aria-label="Audio">
                    {AUDIO.map((a) => (
                      <button
                        key={a.key}
                        role="radio"
                        aria-checked={audio === a.key}
                        onClick={() => setAudio(a.key)}
                        className={`flex-1 rounded-md px-2 py-1 text-[12px] font-medium transition-colors ${
                          audio === a.key ? "bg-white text-black" : "text-white/60 hover:text-white"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <details className="group mt-3">
                    <summary className="cursor-pointer text-[12px] text-white/55 hover:text-white">Show prompt</summary>
                    <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-black/60 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-white/75">
                      {prompt}
                    </pre>
                  </details>
                  <button
                    onClick={copyPrompt}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#22A03A]/60 px-4 py-2 text-[13px] font-medium text-[#22A03A] transition-colors hover:border-[#22A03A] hover:bg-[#22A03A]/10"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy prompt
                  </button>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 pt-2 lg:mt-auto">
                <button
                  onClick={onWaitlist}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#22A03A] px-5 py-2.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
                >
                  <Film className="h-4 w-4" /> Render MP4 · join the waitlist
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={copy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] text-white/80 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy props
                  </button>
                  <button
                    onClick={() => onContent({ ...(t.defaults as Record<string, string | number>) })}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] text-white/80 transition-colors hover:border-white/40 hover:text-white"
                    title="Reset fields"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
