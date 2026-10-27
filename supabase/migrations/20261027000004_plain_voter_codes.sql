drop function if exists public.find_voter_by_code(text);
alter table public.voter_codes rename column code_hash to code;
alter table public.voter_codes drop column if exists display_name;
alter table public.voter_sessions add column if not exists voter_name text;
update public.voter_sessions set voter_name = 'Unknown voter' where voter_name is null;
alter table public.voter_sessions alter column voter_name set not null;
