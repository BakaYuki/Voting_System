delete from public.votes duplicate_vote
using public.votes earlier_vote
where duplicate_vote.voter_id = earlier_vote.voter_id
  and duplicate_vote.project_id = earlier_vote.project_id
  and (duplicate_vote.created_at > earlier_vote.created_at
    or (duplicate_vote.created_at = earlier_vote.created_at and duplicate_vote.id > earlier_vote.id));

create unique index if not exists votes_voter_project_unique
on public.votes(voter_id, project_id);

create or replace function public.submit_vote(p_session_hash text, p_category_id uuid, p_project_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_voter uuid; v_used integer; v_open boolean;
begin
  select is_open into v_open from voting_settings where id = true for update;
  if not coalesce(v_open, false) then raise exception 'Voting is closed'; end if;
  if not exists (select 1 from projects p join categories c on c.id=p.category_id where p.id=p_project_id and p.category_id=p_category_id and p.is_active and c.is_active) then raise exception 'Invalid project or category'; end if;
  select voter_code_id into v_voter from voter_sessions where token_hash = p_session_hash and expires_at > now();
  if v_voter is null then raise exception 'Voter session is invalid'; end if;
  if exists (select 1 from votes where voter_id=v_voter and project_id=p_project_id) then raise exception 'You have already voted for this project'; end if;
  select count(*) into v_used from votes where voter_id=v_voter and category_id=p_category_id;
  if v_used >= 3 then raise exception 'Vote limit reached for this category'; end if;
  insert into votes(voter_id, category_id, project_id) values (v_voter, p_category_id, p_project_id);
  return json_build_object('remaining_votes', 2-v_used);
exception
  when unique_violation then
    raise exception 'You have already voted for this project';
end; $$;

create or replace function public.undo_vote(p_session_hash text, p_category_id uuid, p_project_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_voter uuid; v_open boolean; v_deleted integer;
begin
  select is_open into v_open from voting_settings where id = true for update;
  if not coalesce(v_open, false) then raise exception 'Voting is closed'; end if;
  select voter_code_id into v_voter from voter_sessions where token_hash = p_session_hash and expires_at > now();
  if v_voter is null then raise exception 'Voter session is invalid'; end if;
  delete from votes
  where voter_id = v_voter and category_id = p_category_id and project_id = p_project_id;
  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then raise exception 'Vote not found'; end if;
  return json_build_object('remaining_votes', (select count(*) from votes where voter_id = v_voter and category_id = p_category_id));
end; $$;

revoke all on function public.undo_vote(text, uuid, uuid) from public;
grant execute on function public.undo_vote(text, uuid, uuid) to service_role;
