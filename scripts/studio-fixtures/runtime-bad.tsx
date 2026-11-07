import { AbsoluteFill } from "remotion";
import { type TemplateProps } from "../../kit";
import { fontOf, nameOf, palette, useT } from "../../motion";
type C = { headline: string; items: string };
export default function Broken({ brand: b, content: c }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const items = (c.items || "a, b").split(",");
  const pick = t > 2 ? (items as unknown as { missing: { deep: string } }).missing.deep : c.headline || "Hello";
  return <AbsoluteFill style={{ background: pal.bg, color: pal.fg, fontFamily: fontOf(b), fontSize: 120, alignItems: "center", justifyContent: "center" }}>{pick} {nameOf(b)}</AbsoluteFill>;
}
