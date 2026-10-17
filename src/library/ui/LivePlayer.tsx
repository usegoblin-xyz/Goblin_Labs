import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import type { Brand } from "../brand";
import type { Template } from "../kit";

type Props = {
  template: Template;
  brand: Brand;
  content: Record<string, string | number>;
  controls?: boolean;
  className?: string;
  style?: CSSProperties;
};

// A live Remotion preview. Grid previews play only while on screen, so a page
// full of templates doesn't run a dozen animation loops off-screen.
export function LivePlayer({ template: t, brand, content, controls = false, className, style }: Props) {
  const ref = useRef<PlayerRef>(null);
  const box = useRef<HTMLDivElement>(null);
  const inputProps = useMemo(() => ({ brand, content }), [brand, content]);
  const landscape = t.width >= t.height && t.width / t.height > 1.2;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (controls) {
      ref.current?.play();
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        const p = ref.current;
        if (!p) return;
        if (e.isIntersecting) {
          p.play();
          // The first play() can land before the player is ready; retry once.
          setTimeout(() => {
            if (ref.current && !ref.current.isPlaying()) ref.current.play();
          }, 400);
        } else p.pause();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [controls]);

  return (
    <div
      ref={box}
      className={className}
      style={{
        background: brand.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "background-color 300ms",
        ...style,
      }}
    >
      <Player
        ref={ref}
        component={t.component as never}
        inputProps={inputProps as never}
        durationInFrames={t.durationInFrames}
        fps={t.fps}
        compositionWidth={t.width}
        compositionHeight={t.height}
        // Paused or not yet started, show a finished-looking frame, not a blank one.
        initialFrame={Math.round(t.durationInFrames * 0.55)}
        loop
        muted
        controls={controls}
        clickToPlay={controls}
        doubleClickToFullscreen={controls}
        acknowledgeRemotionLicense
        style={{
          aspectRatio: `${t.width} / ${t.height}`,
          width: landscape ? "100%" : "auto",
          height: landscape ? "auto" : "100%",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />
    </div>
  );
}
