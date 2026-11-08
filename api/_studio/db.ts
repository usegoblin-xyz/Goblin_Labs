// Postgres access for the studio schema (see db/studio.sql).
import pg from "pg";

let pool: pg.Pool | null = null;
export const db = () =>
  (pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: process.env.STUDIO_DB_NO_SSL ? false : { rejectUnauthorized: false },
  }));

export type Field = { key: string; label: string; type: "text" | "textarea"; hint?: string };

// Everything that defines one version of a template.
export type Snapshot = {
  title: string;
  outcome: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  fields: Field[];
  defaults: Record<string, string>;
  code: string;
  compiled: string;
};

export type StudioTemplate = Snapshot & { id: string; prompt: string; version: number; updatedAt: string };

const COLS = `id, title, outcome, category, tags, width, height, fps, duration_in_frames, fields, defaults, code, compiled, prompt, version, updated_at`;

type Row = {
  id: string; title: string; outcome: string; category: string; tags: string[]; width: number; height: number; fps: number;
  duration_in_frames: number; fields: Field[]; defaults: Record<string, string>; code: string; compiled: string; prompt: string;
  version: number; updated_at: Date;
};
const toTemplate = (r: Row): StudioTemplate => ({
  id: r.id, title: r.title, outcome: r.outcome, category: r.category, tags: r.tags, width: r.width, height: r.height, fps: r.fps,
  durationInFrames: r.duration_in_frames, fields: r.fields, defaults: r.defaults, code: r.code, compiled: r.compiled,
  prompt: r.prompt, version: r.version, updatedAt: r.updated_at.toISOString(),
});

export async function getTemplate(userId: string, id: string): Promise<StudioTemplate | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { rows } = await db().query(`select ${COLS} from studio.templates where id = $1 and user_id = $2`, [id, userId]);
  return rows[0] ? toTemplate(rows[0]) : null;
}

export async function listTemplates(userId: string): Promise<StudioTemplate[]> {
  const { rows } = await db().query(`select ${COLS} from studio.templates where user_id = $1 order by updated_at desc limit 100`, [userId]);
  return rows.map(toTemplate);
}

export async function listVersions(templateId: string) {
  const { rows } = await db().query(
    `select version, instruction, created_at from studio.template_versions where template_id = $1 order by version desc limit 50`,
    [templateId],
  );
  return rows.map((r) => ({ version: r.version as number, instruction: r.instruction as string, createdAt: (r.created_at as Date).toISOString() }));
}

export async function createTemplate(userId: string, prompt: string, s: Snapshot): Promise<StudioTemplate> {
  const client = await db().connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      `insert into studio.templates (user_id, title, outcome, category, tags, width, height, fps, duration_in_frames, fields, defaults, code, compiled, prompt)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14) returning ${COLS}`,
      [userId, s.title, s.outcome, s.category, s.tags, s.width, s.height, s.fps, s.durationInFrames, JSON.stringify(s.fields), JSON.stringify(s.defaults), s.code, s.compiled, prompt],
    );
    await client.query(`insert into studio.template_versions (template_id, version, instruction, snapshot) values ($1, 1, $2, $3::jsonb)`, [rows[0].id, prompt, JSON.stringify(s)]);
    await client.query("commit");
    return toTemplate(rows[0]);
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

// Saves `s` as the next version of a template the user owns.
export async function saveVersion(userId: string, id: string, instruction: string, s: Snapshot): Promise<StudioTemplate | null> {
  const client = await db().connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      `update studio.templates set title=$3, outcome=$4, category=$5, tags=$6, width=$7, height=$8, fps=$9, duration_in_frames=$10,
         fields=$11::jsonb, defaults=$12::jsonb, code=$13, compiled=$14, version = version + 1, updated_at = now()
       where id = $1 and user_id = $2 returning ${COLS}`,
      [id, userId, s.title, s.outcome, s.category, s.tags, s.width, s.height, s.fps, s.durationInFrames, JSON.stringify(s.fields), JSON.stringify(s.defaults), s.code, s.compiled],
    );
    if (!rows[0]) {
      await client.query("rollback");
      return null;
    }
    await client.query(`insert into studio.template_versions (template_id, version, instruction, snapshot) values ($1, $2, $3, $4::jsonb)`, [id, rows[0].version, instruction, JSON.stringify(s)]);
    await client.query("commit");
    return toTemplate(rows[0]);
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function getSnapshot(templateId: string, version: number): Promise<Snapshot | null> {
  const { rows } = await db().query(`select snapshot from studio.template_versions where template_id = $1 and version = $2`, [templateId, version]);
  return rows[0]?.snapshot ?? null;
}

export async function deleteTemplate(userId: string, id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  const r = await db().query(`delete from studio.templates where id = $1 and user_id = $2`, [id, userId]);
  return (r.rowCount ?? 0) > 0;
}

// Requests (create + edit) in the last 24 hours; fixes and repairs don't count.
export async function usedToday(userId: string): Promise<number> {
  const { rows } = await db().query(
    `select count(*)::int as n from studio.generations where user_id = $1 and kind in ('create','edit') and created_at > now() - interval '24 hours'`,
    [userId],
  );
  return rows[0].n;
}

export async function chatsToday(userId: string): Promise<number> {
  const { rows } = await db().query(
    `select count(*)::int as n from studio.generations where user_id = $1 and kind = 'chat' and created_at > now() - interval '24 hours'`,
    [userId],
  );
  return rows[0].n;
}

export async function recentRepairs(userId: string, templateId: string): Promise<number> {
  const { rows } = await db().query(
    `select count(*)::int as n from studio.generations where user_id = $1 and template_id = $2 and kind = 'repair' and created_at > now() - interval '15 minutes'`,
    [userId, templateId],
  );
  return rows[0].n;
}

export type GenLog = {
  userId: string; templateId: string | null; kind: "create" | "edit" | "repair" | "fix" | "chat"; model: string; ok: boolean; error?: string;
  inputTokens: number; outputTokens: number; cacheRead: number; cacheWrite: number; ms: number;
};
export async function logGeneration(g: GenLog) {
  await db()
    .query(
      `insert into studio.generations (user_id, template_id, kind, model, ok, error, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, ms)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [g.userId, g.templateId, g.kind, g.model, g.ok, g.error?.slice(0, 1000) ?? null, g.inputTokens, g.outputTokens, g.cacheRead, g.cacheWrite, g.ms],
    )
    .catch((e) => console.error("studio: log failed", (e as Error).message));
}
