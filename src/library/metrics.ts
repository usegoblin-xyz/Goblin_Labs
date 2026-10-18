// Advance widths for Inter (variable) in 1/1000 em, ASCII 32-126, at three
// weights; generated with fontTools from @fontsource-variable/inter. Lets
// templates lay out and morph text exactly, without measuring in the DOM.
const ADV: Record<300 | 600 | 900, number[]> = {
  300: [281,282,440,633,632,937,624,292,348,348,500,653,282,453,282,348,618,394,614,606,629,580,602,560,611,602,282,292,653,653,653,500,971,673,649,728,719,595,588,744,740,262,567,647,564,900,759,759,628,759,634,632,636,736,673,966,662,666,622,348,348,348,448,448,309,549,602,559,602,580,345,603,589,233,234,528,233,873,588,593,602,602,359,516,298,589,556,815,531,556,542,416,312,416,653],
  600: [252,321,523,644,650,1004,663,326,373,373,540,673,319,465,319,379,660,423,623,636,666,612,640,576,640,640,319,329,673,673,673,543,999,728,659,737,722,605,588,749,746,277,580,703,565,922,759,769,645,773,652,650,660,736,728,1020,720,713,652,373,379,373,481,469,351,574,624,583,624,591,389,625,612,262,262,569,262,900,612,609,624,624,397,549,353,612,587,839,569,588,566,455,359,455,673],
  900: [199,381,625,662,666,1044,695,372,388,388,608,693,373,475,373,412,711,452,646,669,702,646,675,595,679,675,373,378,693,693,693,601,1059,795,668,748,723,613,584,754,750,291,596,759,565,956,770,775,656,787,668,666,687,722,795,1082,786,775,694,388,412,388,500,493,401,597,646,603,646,606,422,647,649,296,296,606,296,943,649,625,646,646,434,588,399,649,632,877,609,636,590,505,405,505,693],
};

function adv(ch: string, weight: number) {
  const i = ch.charCodeAt(0) - 32;
  const at = (w: 300 | 600 | 900) => ADV[w][i] ?? 600;
  const w = Math.min(900, Math.max(300, weight));
  return w <= 600 ? at(300) + ((at(600) - at(300)) * (w - 300)) / 300 : at(600) + ((at(900) - at(600)) * (w - 600)) / 300;
}

// Width in px of `s` at `size` px and `weight`, with letter-spacing in em.
export function textWidth(s: string, size: number, weight = 700, tracking = 0) {
  let sum = 0;
  for (const ch of s) sum += adv(ch, weight) / 1000 + tracking;
  return sum * size;
}

// Left edge of each character, plus the total width as the last entry.
export function charX(s: string, size: number, weight = 700, tracking = 0) {
  const xs = [0];
  for (const ch of s) xs.push(xs[xs.length - 1] + (adv(ch, weight) / 1000 + tracking) * size);
  return xs;
}
