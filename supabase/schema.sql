-- 多人游戏计分板 · Supabase 建表脚本
-- 使用方法：Supabase 控制台 → SQL Editor → 粘贴本文件全部内容 → Run
-- 详见 PRD.md 第 7 节
-- 注意：会删除已有同名表（含数据）后重建

drop table if exists scores cascade;
drop table if exists rounds cascade;
drop table if exists players cascade;
drop table if exists rooms cascade;

-- 房间 ID 为前端生成的 8 位短码（见 src/lib/roomId.js），便于分享
create table rooms (
  id text primary key,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  last_active_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id),
  name text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  unique (room_id, name)
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id),
  round_number int not null,
  created_at timestamptz not null default now(),
  unique (room_id, round_number)
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  score int not null,
  unique (round_id, player_id)
);

create index players_room_id_idx on players (room_id);
create index rounds_room_id_idx on rounds (room_id);
create index scores_round_id_idx on scores (round_id);

-- RLS：对 anon 全开放（安全边界 = 房间 ID 不可猜测，见 PRD 7 节）
alter table rooms enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table scores enable row level security;

create policy "anon_all_rooms" on rooms for all to anon using (true) with check (true);
create policy "anon_all_players" on players for all to anon using (true) with check (true);
create policy "anon_all_rounds" on rounds for all to anon using (true) with check (true);
create policy "anon_all_scores" on scores for all to anon using (true) with check (true);

-- Realtime：将四表加入实时发布
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table scores;
