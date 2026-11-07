import { Audio, staticFile } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import type { Brand } from "../src/library/brand";
import { EditorialAd } from "../src/library/templates/EditorialAd";
import { GECKO_PATH as GECKO } from "../src/library/gecko";

// Goblin's own launch film: the Editorial Brand Film template in the Goblin
// brand kit, with the green gecko in place of the "G" and a voiceover mixed
// over the template's soundtrack (public/launch/goblin-launch-mix.wav).
//   node scripts/render.mjs goblin-launch out/goblin-launch.mp4


export const GOBLIN_BRAND: Brand = {
  name: "Goblin",
  background: "#050505",
  foreground: "#f5f5f2",
  primary: "#22a03a",
  accent: "#b6f09c",
  font: "inter",
  motion: "snappy",
};

const CONTENT = { word1: "flat", word2: "float", line1: "Make it", line2: "move", steps: "Design, Animate, Ship" };

export function GoblinLaunch({ blur = 0 }: { blur?: number }) {
  const film = <EditorialAd brand={GOBLIN_BRAND} content={CONTENT} audio={false} glyph={GECKO} />;
  return (
    <>
      {blur > 1 ? (
        <CameraMotionBlur samples={blur} shutterAngle={180}>
          {film}
        </CameraMotionBlur>
      ) : (
        film
      )}
      <Audio src={staticFile("launch/goblin-launch-mix.wav")} />
    </>
  );
}
