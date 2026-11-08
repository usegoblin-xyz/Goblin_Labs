// Where generated templates' sound effects come from (see sfx-names.ts).
import { staticFile } from "remotion";
import { SFX, SFX_NAMES, isSfx, type SfxName } from "./sfx-names";

export { SFX, SFX_NAMES, isSfx, type SfxName };
// Where a sound's file lives. The preview sandbox has no network, so it
// swaps in blob URLs it was handed; everywhere else uses public/sfx/.
let resolve: (name: SfxName) => string | null = (name) => staticFile(`sfx/${name}.wav`);
export const setSfxResolver = (f: (name: SfxName) => string | null) => {
  resolve = f;
};
export const sfxSrc = (name: SfxName) => resolve(name);

// Sound names a compiled template uses, so only those get sent to the sandbox.
export const sfxUsedIn = (code: string): SfxName[] => SFX_NAMES.filter((n) => code.includes(`"${n}"`));
