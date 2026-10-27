alter table public.projects
add column if not exists school_name text not null default '',
add column if not exists student_name text not null default '';

drop view if exists public.project_results;

create view public.project_results as
select p.id, p.category_id, p.name, p.description, p.image_url,
  p.school_name, p.student_name,
  count(v.id)::int as vote_count,
  case when sum(count(v.id)) over (partition by p.category_id) = 0 then 0
  else round((count(v.id)::numeric / sum(count(v.id)) over (partition by p.category_id)) * 10, 4) end as score
from public.projects p left join public.votes v on v.project_id = p.id
group by p.id;

grant select on public.project_results to service_role;
