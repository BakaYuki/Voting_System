alter table public.voter_codes
add column if not exists display_name text;
