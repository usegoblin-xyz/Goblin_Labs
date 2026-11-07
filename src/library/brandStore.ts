// The visitor's brand kit, remembered in this browser and shared by every page.
import { DEFAULT_BRAND, type Brand } from "./brand";

export const BRAND_KEY = "goblin_brand_kit";

export function loadBrand(): Brand {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (raw) return { ...DEFAULT_BRAND, ...JSON.parse(raw) };
  } catch {
    /* storage blocked — fall back to default */
  }
  return DEFAULT_BRAND;
}

export function saveBrand(b: Brand) {
  try {
    localStorage.setItem(BRAND_KEY, JSON.stringify(b));
  } catch {
    /* storage blocked: kept for this visit only */
  }
}
