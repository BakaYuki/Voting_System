create or replace function public.undo_vote(p_session_hash text, p_category_id uuid, p_project_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voter uuid;
  v_open boolean;
  v_deleted integer;
begin
  select is_open into v_open
  from voting_settings
  where id = true
  for update;

  if not coalesce(v_open, false) then
    raise exception 'Voting is closed';
  end if;

  select voter_code_id into v_voter
  from voter_sessions
  where token_hash = p_session_hash
    and expires_at > now();

  if v_voter is null then
    raise exception 'Voter session is invalid';
  end if;

  delete from votes
  where voter_id = v_voter
    and category_id = p_category_id
    and project_id = p_project_id;

  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    raise exception 'Vote not found';
  end if;

  return json_build_object(
    'remaining_votes',
    3 - (select count(*) from votes where voter_id = v_voter and category_id = p_category_id)
  );
end;
$$;

revoke all on function public.undo_vote(text, uuid, uuid) from public;
grant execute on function public.undo_vote(text, uuid, uuid) to service_role;
