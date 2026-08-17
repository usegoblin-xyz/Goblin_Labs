/// <reference types="vite/client" />

// Virtual asset ids resolved by the figma-asset-resolver plugin in vite.config.ts.
declare module "figma:asset/*" {
  const src: string;
  export default src;
}
