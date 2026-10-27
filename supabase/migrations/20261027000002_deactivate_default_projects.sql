-- Hide the example projects in existing databases without deleting their history.
update public.projects
set is_active = false, updated_at = now()
where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);
