import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ComponentType, Ref } from "react";
import { Player as RemotionPlayer, type PlayerRef } from "@remotion/player";

// Remotion's Player props are typed against zod 3, but the app also installs
// zod 4 (Better Auth), which breaks that inference. The props are unchanged.
const Player = RemotionPlayer as unknown as ComponentType<Record<string, unknown> & { ref?: Ref<PlayerRef> }>;
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
  const inputProps = useMemo(() => ({ brand, content, audio: controls }), [brand, content, controls]);
  const landscape = t.width >= t.height && t.width / t.height > 1.2;
  // Grid cards mount their player only near the viewport, so a library of
  // hundreds of templates never runs (or downloads) more than a handful.
  const [near, setNear] = useState(controls);

  useEffect(() => {
    const el = box.current;
    if (!el || controls) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [controls]);

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
  }, [controls, near]);

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
      {near && (
      <Player
        ref={ref}
        {...(t.component ? { component: t.component as never } : { lazyComponent: t.lazy as never })}
        inputProps={inputProps as never}
        durationInFrames={t.durationInFrames}
        fps={t.fps}
        compositionWidth={t.width}
        compositionHeight={t.height}
        // Paused or not yet started, show a finished-looking frame, not a blank one.
        initialFrame={Math.round(t.durationInFrames * 0.55)}
        loop
        muted={!controls}
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
      )}
    </div>
  );
}
