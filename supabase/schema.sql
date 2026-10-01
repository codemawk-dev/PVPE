-- =====================================================================
-- PVPE — schema do Supabase
-- Rode este arquivo inteiro no SQL Editor do projeto (uma vez).
-- Depois: preencha assets/js/config.js e crie o usuário admin em
-- Authentication → Users. Desative "Allow new users to sign up" em
-- Authentication → Providers → Email, para ninguém mais criar conta:
-- qualquer usuário autenticado pode editar os dados.
-- =====================================================================

create extension if not exists pgcrypto;

-- Mantém updated_at atualizado
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- ÚLTIMOS JOGOS
-- ---------------------------------------------------------------------
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  team_home   text not null default 'PVPE',
  team_away   text not null,
  score_home  smallint not null default 0 check (score_home >= 0),
  score_away  smallint not null default 0 check (score_away >= 0),
  event       text,
  result      text,
  played_at   date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists games_played_at_idx on public.games (played_at desc);

-- ---------------------------------------------------------------------
-- CAMPEONATOS
-- ---------------------------------------------------------------------
create table if not exists public.championships (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                   text not null,
  starts_at              timestamptz,
  ends_at                timestamptz,
  date_label             text,
  time_label             text,
  location               text,
  description            text,
  teams_female           text[] not null default '{}',
  teams_male             text[] not null default '{}',
  registration_fee       text,
  registration_fee_note  text,
  registrations_open     boolean not null default true,
  prize_first            text,
  prize_first_extra      text,
  prize_second           text,
  logo_url               text,
  banner_url             text,
  featured               boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
-- só um campeonato em destaque por vez (é o que aparece na landing)
create unique index if not exists championships_one_featured
  on public.championships (featured) where featured;

-- ---------------------------------------------------------------------
-- TELEFONES (o principal é usado em todos os botões de WhatsApp)
-- ---------------------------------------------------------------------
create table if not exists public.phones (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  number      text not null check (number ~ '^[0-9]{12,13}$'),
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists phones_one_primary
  on public.phones (is_primary) where is_primary;

-- ---------------------------------------------------------------------
-- PARCEIROS
-- ---------------------------------------------------------------------
create table if not exists public.partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  segment     text,
  logo_url    text,
  logo_full   boolean not null default false,
  link_url    text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- triggers de updated_at
do $$
declare t text;
begin
  foreach t in array array['games', 'championships', 'phones', 'partners'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format('create trigger %I_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- RLS: leitura pública (o site), escrita só para usuários logados (painel)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['games', 'championships', 'phones', 'partners'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_public_read" on public.%I', t, t);
    execute format('create policy "%s_public_read" on public.%I
                    for select to anon, authenticated using (true)', t, t);
    execute format('drop policy if exists "%s_admin_write" on public.%I', t, t);
    execute format('create policy "%s_admin_write" on public.%I
                    for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- PERMISSÕES (GRANT): sem elas o Postgres recusa o acesso antes mesmo da RLS
-- ("permission denied for table ..."). Projetos novos do Supabase podem não
-- liberar tabelas novas automaticamente para a API, então liberamos aqui.
-- Visitantes (anon) só leem; usuários logados (painel) leem e escrevem.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.games, public.championships, public.phones, public.partners
  to anon, authenticated;
grant insert, update, delete on public.games, public.championships, public.phones, public.partners
  to authenticated;

-- ---------------------------------------------------------------------
-- STORAGE: bucket público para logos de parceiros e campeonatos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('pvpe', 'pvpe', true)
on conflict (id) do nothing;

drop policy if exists "pvpe_public_read" on storage.objects;
create policy "pvpe_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'pvpe');

drop policy if exists "pvpe_admin_insert" on storage.objects;
create policy "pvpe_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'pvpe');

drop policy if exists "pvpe_admin_update" on storage.objects;
create policy "pvpe_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'pvpe');

drop policy if exists "pvpe_admin_delete" on storage.objects;
create policy "pvpe_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'pvpe');

-- ---------------------------------------------------------------------
-- DADOS INICIAIS (mesmo conteúdo de assets/js/data/seed.js)
-- ---------------------------------------------------------------------
insert into public.games (id, team_home, team_away, score_home, score_away, event, result, played_at) values
  ('b3b0c1a2-0001-4c1a-9a00-000000000001', 'PVPE', 'ITABUNA VC',   3, 1, 'COPA SUL DA BAHIA',        'CAMPEÃO FEMININO',      '2027-03-01'),
  ('b3b0c1a2-0001-4c1a-9a00-000000000002', 'PVPE', 'ILHÉUS VÔLEI', 3, 2, 'JOGOS ESCOLARES DA BAHIA', 'CAMPEÃO MASCULINO',     '2027-02-01'),
  ('b3b0c1a2-0001-4c1a-9a00-000000000003', 'PVPE', 'JEQUIÉ SPORT', 2, 3, 'TORNEIO REGIONAL SUB-17',  'VICE-CAMPEÃO FEMININO', '2027-01-01')
on conflict (id) do nothing;

insert into public.championships (
  id, slug, name, starts_at, ends_at, date_label, time_label, location, description,
  teams_female, teams_male, registration_fee, registration_fee_note, registrations_open,
  prize_first, prize_first_extra, prize_second, logo_url, banner_url, featured
) values (
  'b3b0c1a2-0002-4c1a-9a00-000000000001', 'copa-do-mel', '1º Copa do Mel de Vôlei',
  '2026-11-28T08:00:00-03:00', '2026-11-29T20:00:00-03:00',
  '28 E 29 DE NOVEMBRO', 'A PARTIR DAS 8H', 'FERREIRÃO',
  'A 1º Copa do Mel de Vôlei reúne equipes da região em dois dias de jogos, com disputas no feminino e no masculino. Organizada pelo PVPE, a copa celebra o esporte, a disciplina e a união das nossas comunidades — com torcida animada, muita garra e um campeonato doce como mel. Traga sua família e venha torcer!',
  array['URUÇUCA', 'GUAXINIM', 'GUAXINIM SUB', 'AABB ILHÉUS', 'ITAPITANGA', 'ELITE VÔLEI CLUBE (UNA)'],
  array['URUÇUCA', 'ITAPITANGA', 'A.D. GARRA (IPIAÚ)', 'ELITE VÔLEI CLUBE (UNA)', 'VNV - MODELO (ITABUNA)', 'ALPHA (UBAITABA)'],
  'R$ 350', 'POR EQUIPE', false,
  'R$ 1.000', '+ TROFÉU', 'MEDALHAS',
  'assets/img/logo-camp-mel.webp', 'assets/img/camp-bg.webp', true
) on conflict (id) do nothing;

insert into public.phones (id, label, number, is_primary) values
  ('b3b0c1a2-0003-4c1a-9a00-000000000001', 'WhatsApp principal', '5573991335759', true)
on conflict (id) do nothing;

insert into public.partners (id, name, segment, logo_url, logo_full, link_url, sort_order) values
  ('b3b0c1a2-0004-4c1a-9a00-000000000001', 'codeMAWK',    'Tecnologia',   'assets/img/parceiros/codemawk.webp',          true,  'https://instagram.com/codemawk', 1),
  ('b3b0c1a2-0004-4c1a-9a00-000000000002', 'devART',      'Design & Dev', 'assets/img/parceiros/devart.webp',            true,  'https://www.devartx.com',        2)
on conflict (id) do nothing;
