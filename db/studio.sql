-- Template generation ("Create" page): saved templates, their version
-- history, and a log of every Claude call for quotas and cost tracking.
-- Apply once to the goblin-auth Supabase project (as postgres). Mirrors the
-- newsletter schema: owned by postgres, used by the app role goblin_auth.
-- Not exposed through the Supabase Data API.

create schema if not exists studio;
grant usage on schema studio to goblin_auth;

create table if not exists studio.templates (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references better_auth."user"(id) on delete cascade,
  title text not null,
  outcome text not null default '',
  category text not null,
  tags text[] not null default '{}',
  width int not null,
  height int not null,
  fps int not null default 30,
  duration_in_frames int not null,
  fields jsonb not null,
  defaults jsonb not null,
  code text not null,
  compiled text not null,
  prompt text not null,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists templates_user_idx on studio.templates (user_id, updated_at desc);

-- One row per saved version; `snapshot` holds everything needed to restore it.
create table if not exists studio.template_versions (
  template_id uuid not null references studio.templates(id) on delete cascade,
  version int not null,
  instruction text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  primary key (template_id, version)
);

create table if not exists studio.generations (
  id bigserial primary key,
  user_id text not null references better_auth."user"(id) on delete cascade,
  template_id uuid references studio.templates(id) on delete set null,
  -- create/edit: a user request; repair: a fix after the preview reported an
  -- error; fix: a follow-up call inside one request after the checks failed;
  -- chat: one of Goblin's conversational replies.
  kind text not null check (kind in ('create', 'edit', 'repair', 'fix', 'chat')),
  model text not null,
  ok boolean not null,
  error text,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_write_tokens int not null default 0,
  ms int not null default 0,
  created_at timestamptz not null default now()
);
-- Databases created before chat was added: widen the kind check.
alter table studio.generations drop constraint if exists generations_kind_check;
alter table studio.generations add constraint generations_kind_check check (kind in ('create', 'edit', 'repair', 'fix', 'chat'));
create index if not exists generations_user_idx on studio.generations (user_id, created_at desc);

grant select, insert, update, delete on studio.templates, studio.template_versions, studio.generations to goblin_auth;
grant usage, select on sequence studio.generations_id_seq to goblin_auth;
