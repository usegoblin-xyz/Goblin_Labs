// The homepage greeting for signed-in users: a different line each visit,
// in Goblin's own voice (a gecko's: walls, warm rocks, sun, moths, tails),
// picked to suit the time of day. `{name}` becomes the user's first name;
// without a name, each line has a version that reads without it.

type Line = [withName: string, withoutName: string];

const MORNING: Line[] = [
  ["Good morning, {name}", "Good morning"],
  ["Morning, {name}. The sun's on the wall", "Morning. The sun's on the wall"],
  ["Early gecko, {name}?", "Early gecko?"],
  ["Rise and climb, {name}", "Rise and climb"],
  ["Fresh scales, fresh ideas, {name}", "Fresh scales, fresh ideas"],
];
const AFTERNOON: Line[] = [
  ["Good afternoon, {name}", "Good afternoon"],
  ["Basking hours, {name}", "Basking hours"],
  ["Warm rock, bright ideas, {name}", "Warm rock, bright ideas"],
  ["Afternoon, {name}. Tail's up", "Afternoon. Tail's up"],
];
const EVENING: Line[] = [
  ["Good evening, {name}", "Good evening"],
  ["Golden hour, {name}", "Golden hour"],
  ["Evening, {name}. Eyes wide open", "Evening. Eyes wide open"],
  ["Lights on, moths out, {name}", "Lights on, moths out"],
];
const NIGHT: Line[] = [
  ["Night gecko, {name}?", "Night gecko?"],
  ["Still climbing, {name}?", "Still climbing?"],
  ["Up with the moths, {name}", "Up with the moths"],
  ["Moonlit and making things, {name}", "Moonlit and making things"],
];
// Fit any time of day.
const ANYTIME: Line[] = [
  ["Back on the wall, {name}", "Back on the wall"],
  ["Ready to scale something, {name}?", "Ready to scale something?"],
  ["Look who crawled in, {name}", "Look who crawled in"],
  ["Tail up, {name}. Let's make something", "Tail up. Let's make something"],
  ["Sticky feet, big plans, {name}", "Sticky feet, big plans"],
];

export function linesFor(hour: number): Line[] {
  const now = hour >= 5 && hour < 12 ? MORNING : hour >= 12 && hour < 17 ? AFTERNOON : hour >= 17 && hour < 22 ? EVENING : NIGHT;
  return [...now, ...ANYTIME];
}

// A name worth greeting by: not a bare email prefix (new email accounts are named
// after theirs), with the first letter capitalised.
export function greetingName(fullName: string | null | undefined, email?: string | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  if (!first) return null;
  const local = email?.split("@")[0]?.toLowerCase();
  if (local && fullName!.trim().toLowerCase() === local) return null;
  if (!/^\p{L}/u.test(first) || first.length > 24) return null;
  return first[0].toUpperCase() + first.slice(1);
}

const LAST_KEY = "goblin.lastGreeting";

// One line for this visit, never the same as last time.
export function pickGreeting(name: string | null, now = new Date(), rand = Math.random): string {
  const lines = linesFor(now.getHours());
  let last = -1;
  try {
    last = Number(localStorage.getItem(LAST_KEY) ?? -1);
  } catch {
    /* storage can be blocked */
  }
  let i = Math.floor(rand() * lines.length);
  if (i === last) i = (i + 1) % lines.length;
  try {
    localStorage.setItem(LAST_KEY, String(i));
  } catch {
    /* ignore */
  }
  const [withName, without] = lines[i];
  return name ? withName.replace("{name}", name) : without;
}
