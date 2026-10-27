create extension if not exists pgcrypto;

create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null unique, description text not null default '', is_active boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.projects (id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories(id) on delete restrict, name text not null, description text not null default '', image_url text, is_active boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.voter_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.voter_sessions (id uuid primary key default gen_random_uuid(), voter_code_id uuid not null references public.voter_codes(id) on delete cascade, token_hash text not null unique, created_at timestamptz not null default now(), expires_at timestamptz not null default (now() + interval '180 days'));
create table public.voting_settings (id boolean primary key default true, is_open boolean not null default false, opened_at timestamptz, closed_at timestamptz, updated_at timestamptz not null default now(), updated_by uuid references auth.users(id));
insert into public.voting_settings (id) values (true) on conflict do nothing;
insert into public.categories (id, name, description, is_active) values
('00000000-0000-0000-0000-000000000010', 'Community', 'Projects that make our community stronger.', true),
('00000000-0000-0000-0000-000000000011', 'Innovation', 'Fresh ideas and practical solutions.', true),
('00000000-0000-0000-0000-000000000012', 'Sustainability', 'Ideas that help protect our shared future.', true)
on conflict (id) do nothing;
insert into public.projects (id, category_id, name, description, is_active) values
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Neighbourhood Tool Library', 'A shared place to borrow tools, learn practical skills, and help neighbours.', true),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', 'Welcoming Streets', 'Small improvements that make walking and meeting friends safer and easier.', true),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', 'Community Skills Exchange', 'A regular event where residents share knowledge, time, and encouragement.', true)
on conflict (id) do nothing;
create table public.votes (id uuid primary key default gen_random_uuid(), voter_id uuid not null references public.voter_codes(id) on delete restrict, category_id uuid not null references public.categories(id) on delete restrict, project_id uuid not null references public.projects(id) on delete restrict, created_at timestamptz not null default now());
create index votes_voter_category_idx on public.votes(voter_id, category_id);
create index votes_project_idx on public.votes(project_id);

create or replace view public.project_results as
select p.id, p.category_id, p.name, p.description, p.image_url, count(v.id)::int as vote_count,
case when sum(count(v.id)) over (partition by p.category_id) = 0 then 0
else round((count(v.id)::numeric / sum(count(v.id)) over (partition by p.category_id)) * 10, 4) end as score
from public.projects p left join public.votes v on v.project_id = p.id
group by p.id;

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.voter_codes enable row level security;
alter table public.voter_sessions enable row level security;
alter table public.votes enable row level security;
alter table public.voting_settings enable row level security;
create policy "public reads active categories" on public.categories for select using (is_active);
create policy "public reads active projects" on public.projects for select using (is_active and exists (select 1 from public.categories c where c.id = category_id and c.is_active));
create policy "admins manage categories" on public.categories for all using (exists (select 1 from public.admin_users a where a.user_id = auth.uid())) with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
create policy "admins manage projects" on public.projects for all using (exists (select 1 from public.admin_users a where a.user_id = auth.uid())) with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
create policy "admins manage settings" on public.voting_settings for all using (exists (select 1 from public.admin_users a where a.user_id = auth.uid())) with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
revoke all on public.votes from anon, authenticated;
revoke all on public.voter_codes, public.voter_sessions from anon, authenticated;

create or replace function public.find_voter_by_code(p_code_hash text)
returns table(id uuid, display_name text) language sql security definer set search_path = public as $$
  select v.id, v.display_name from voter_codes v where v.code_hash = p_code_hash and v.is_active limit 1
$$;
revoke all on function public.find_voter_by_code(text) from public;
grant execute on function public.find_voter_by_code(text) to service_role;

create or replace function public.submit_vote(p_session_hash text, p_category_id uuid, p_project_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_voter uuid; v_used integer; v_open boolean;
begin
  select is_open into v_open from voting_settings where id = true for update;
  if not coalesce(v_open, false) then raise exception 'Voting is closed'; end if;
  if not exists (select 1 from projects p join categories c on c.id=p.category_id where p.id=p_project_id and p.category_id=p_category_id and p.is_active and c.is_active) then raise exception 'Invalid project or category'; end if;
  select voter_code_id into v_voter from voter_sessions where token_hash = p_session_hash and expires_at > now();
  if v_voter is null then raise exception 'Voter session is invalid'; end if;
  select count(*) into v_used from votes where voter_id=v_voter and category_id=p_category_id;
  if v_used >= 3 then raise exception 'Vote limit reached for this category'; end if;
  insert into votes(voter_id, category_id, project_id) values (v_voter, p_category_id, p_project_id);
  return json_build_object('remaining_votes', 2-v_used);
end; $$;
revoke all on function public.submit_vote(text, uuid, uuid) from public;
grant execute on function public.submit_vote(text, uuid, uuid) to service_role;
