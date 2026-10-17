import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { Audio, Composition, staticFile } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { DEFAULT_BRAND, type Brand } from "../src/library/brand";
import { TEMPLATES } from "../src/library/registry";

type Props = { brand: Brand; content: Record<string, string | number>; templateId: string; blur: number };

// Renders any library template; `blur` = motion-blur samples (0 = off).
function Render({ brand, content, templateId, blur }: Props) {
  const t = TEMPLATES.find((x) => x.id === templateId)!;
  const C = t.component as React.ComponentType<{ brand: Brand; content: Record<string, string | number>; audio?: boolean }>;
  if (blur <= 1) return <C brand={brand} content={content} audio />;
  // Motion blur renders its children several times per frame and drops their
  // audio, so the soundtrack plays from outside the blur wrapper.
  return (
    <>
      <CameraMotionBlur samples={blur} shutterAngle={180}>
        <C brand={brand} content={content} audio={false} />
      </CameraMotionBlur>
      {t.soundtrack && <Audio src={staticFile(t.soundtrack)} />}
    </>
  );
}

export function Root() {
  return (
    <>
      {TEMPLATES.map((t) => (
        <Composition
          key={t.id}
          id={t.id}
          component={Render as never}
          width={t.width}
          height={t.height}
          fps={t.fps}
          durationInFrames={t.durationInFrames}
          defaultProps={{ brand: DEFAULT_BRAND, content: t.defaults, templateId: t.id, blur: 0 } as never}
        />
      ))}
    </>
  );
}
