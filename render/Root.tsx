import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource-variable/inter";
import { Audio, Composition, staticFile } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { DEFAULT_BRAND, type Brand } from "../src/library/brand";
import { TEMPLATES } from "../src/library/registry";

type Props = { brand: Brand; content: Record<string, string | number>; templateId: string; blur: number };
type Comp = React.ComponentType<{ brand: Brand; content: Record<string, string | number>; audio?: boolean }>;

// Wraps a library template for rendering; `blur` = motion-blur samples (0 = off).
function withRender(C: Comp, soundtrack?: string) {
  return function Render({ brand, content, blur }: Props) {
    if (blur <= 1) return <C brand={brand} content={content} audio />;
    // Motion blur renders its children several times per frame and drops their
    // audio, so the soundtrack plays from outside the blur wrapper.
    return (
      <>
        <CameraMotionBlur samples={blur} shutterAngle={180}>
          <C brand={brand} content={content} audio={false} />
        </CameraMotionBlur>
        {soundtrack && <Audio src={staticFile(soundtrack)} />}
      </>
    );
  };
}

export function Root() {
  return (
    <>
      {TEMPLATES.map((t) => {
        const common = {
          id: t.id,
          width: t.width,
          height: t.height,
          fps: t.fps,
          durationInFrames: t.durationInFrames,
          defaultProps: { brand: DEFAULT_BRAND, content: t.defaults, templateId: t.id, blur: 0 } as never,
        };
        return t.component ? (
          <Composition key={t.id} {...common} component={withRender(t.component as Comp, t.soundtrack) as never} />
        ) : (
          <Composition key={t.id} {...common} lazyComponent={() => t.lazy!().then((m) => ({ default: withRender(m.default as Comp, t.soundtrack) })) as never} />
        );
      })}
    </>
  );
}
