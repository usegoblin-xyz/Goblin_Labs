export const config = { runtime: "edge" };

const ANAM_BASE = "https://api.anam.ai/v1";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  const apiKey = process.env.ANAM_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANAM_API_KEY not set" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // includeDefaults=true so the platform's stock LLMs (GPT-4o-mini, etc.) show up
  // alongside any account-specific configs; perPage high enough to skip paging.
  const upstream = await fetch(`${ANAM_BASE}/llms?perPage=100&includeDefaults=true`, {
    headers: { authorization: `Bearer ${apiKey}` },
    // The LLM catalog rarely changes; let a hot edge skip the round-trip.
    // @ts-expect-error - Vercel edge fetch supports `next.revalidate`
    next: { revalidate: 600 },
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
