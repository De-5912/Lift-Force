-- Requirement discovery is private to workers/vendors; companies see only their own.
-- Central helper also protects job_roles and job_skills through existing RLS policies.
create or replace function private.job_visible(j uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.jobs job
    where job.id = j and case private.active_role()
      when 'ADMIN' then true
      when 'COMPANY' then job.owner_id = auth.uid()
      when 'WORKER' then (
        (job.status = 'OPEN' and job.deadline >= current_date
          and exists (select 1 from public.accounts owner where owner.id = job.owner_id and not owner.suspended))
        or private.has_submission(j) or private.has_deployment(j)
      )
      when 'VENDOR' then (
        (job.status = 'OPEN' and job.deadline >= current_date
          and exists (select 1 from public.accounts owner where owner.id = job.owner_id and not owner.suspended))
        or private.has_submission(j) or private.has_deployment(j)
      )
      else false
    end
  )
$$;
-- Keep anonymous SELECT queries empty rather than exposing project records.
alter policy job_read on public.jobs to authenticated;
alter policy job_role_read on public.job_roles to authenticated;
alter policy job_skill_read on public.job_skills to authenticated;
