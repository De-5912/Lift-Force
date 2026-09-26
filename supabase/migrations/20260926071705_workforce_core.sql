-- Read access uses RLS. All writes use authorized, transactional commands.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon;
create type public.account_role as enum ('COMPANY','WORKER','VENDOR','ADMIN');
create type public.job_status as enum ('DRAFT','OPEN','PAUSED','CLOSED','FILLED','IN_PROGRESS','COMPLETED','CANCELLED','EXPIRED');
create type public.application_status as enum ('APPLIED','UNDER_REVIEW','SHORTLISTED','INTERVIEW_REQUESTED','SELECTED','REJECTED','WITHDRAWN','DEPLOYMENT_CONFIRMED','COMPLETED');
create type public.proposal_status as enum ('SUBMITTED','UNDER_REVIEW','SHORTLISTED','NEGOTIATION','ACCEPTED','REJECTED','WITHDRAWN','DEPLOYMENT_CONFIRMED','COMPLETED');
create table public.accounts(id uuid primary key references auth.users on delete restrict,role public.account_role not null,suspended boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.industries(id uuid primary key default gen_random_uuid(),name text not null unique);
create table public.categories(id uuid primary key default gen_random_uuid(),industry_id uuid not null references public.industries,name text not null,unique(industry_id,name));
create table public.worker_roles(id uuid primary key default gen_random_uuid(),industry_id uuid not null references public.industries,name text not null,unique(industry_id,name));
create table public.skills(id uuid primary key default gen_random_uuid(),industry_id uuid not null references public.industries,name text not null,unique(industry_id,name));
create table public.profiles(id uuid primary key references public.accounts on delete restrict,kind public.account_role not null,name text not null check(length(name) between 2 and 180),city text not null default '',state text not null default '',bio text not null default '' check(length(bio)<=5000),experience integer not null default 0 check(experience between 0 and 60),primary_role text not null default '',availability text not null default '',expected_rate numeric not null default 0 check(expected_rate>=0),verified boolean not null default false,rating numeric not null default 0,completed_count integer not null default 0,website text not null default '',languages text not null default '',brands text not null default '',travel boolean not null default false,team_size integer not null default 0 check(team_size>=0),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.organizations(id uuid primary key default gen_random_uuid(),owner_id uuid not null unique references public.profiles,name text not null,gst_number text not null default '',phone text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.organization_members(organization_id uuid references public.organizations on delete cascade,user_id uuid references public.accounts,member_role text not null default 'OWNER',primary key(organization_id,user_id));
create table public.profile_skills(profile_id uuid references public.profiles on delete cascade,skill_id uuid references public.skills,primary key(profile_id,skill_id));
create table public.profile_roles(profile_id uuid references public.profiles on delete cascade,role_id uuid references public.worker_roles,primary key(profile_id,role_id));
alter table public.profile_roles enable row level security;
revoke all on public.profile_roles from anon,authenticated;
grant select on public.profile_roles to anon,authenticated;
create table public.profile_experience(id uuid primary key default gen_random_uuid(),profile_id uuid not null references public.profiles,employer text not null,project text not null,description text not null,created_at timestamptz not null default now());
create table public.jobs(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles,organization_id uuid references public.organizations,category_id uuid not null references public.categories,title text not null check(length(title) between 8 and 180),description text not null check(length(description) between 30 and 5000),scope text not null check(length(scope) between 20 and 5000),city text not null,state text not null,site_name text not null default '',start_date date not null,end_date date not null,deadline date not null,duration text not null,shift text not null,hours numeric not null check(hours between 1 and 16),rate_basis text not null check(rate_basis in ('DAY','SHIFT','MONTH','HOUR','PROJECT','NEGOTIATED')),min_rate numeric not null check(min_rate>=0),max_rate numeric not null,payment_terms text not null,individuals boolean not null,vendors boolean not null,accommodation text not null check(accommodation in ('YES','NO','NEGOTIABLE')),food text not null check(food in ('YES','NO','NEGOTIABLE')),travel text not null check(travel in ('YES','NO','NEGOTIABLE')),ppe text not null check(ppe in ('YES','NO','NEGOTIABLE')),tools text not null check(tools in ('YES','NO','NEGOTIABLE')),safety text not null default '',status public.job_status not null default 'DRAFT',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(end_date>=start_date),check(deadline<=start_date),check(max_rate>=min_rate),check(individuals or vendors));
create table public.job_private(job_id uuid primary key references public.jobs on delete cascade,address text not null default '');
create table public.job_roles(id uuid primary key default gen_random_uuid(),job_id uuid not null references public.jobs on delete cascade,role_id uuid not null references public.worker_roles,quantity integer not null check(quantity between 1 and 1000),min_experience integer not null check(min_experience between 0 and 60),filled integer not null default 0 check(filled>=0 and filled<=quantity),unique(job_id,role_id));
create table public.job_skills(job_id uuid references public.jobs on delete cascade,skill_id uuid references public.skills,primary key(job_id,skill_id));
create table public.applications(id uuid primary key default gen_random_uuid(),job_id uuid not null references public.jobs,applicant_id uuid not null references public.profiles,job_role_id uuid not null references public.job_roles,status public.application_status not null default 'APPLIED',rate numeric not null check(rate>=0),rate_basis text not null,start_date date not null,message text not null check(length(message) between 10 and 5000),experience text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(job_id,applicant_id));
create table public.proposals(id uuid primary key default gen_random_uuid(),job_id uuid not null references public.jobs,applicant_id uuid not null references public.profiles,status public.proposal_status not null default 'SUBMITTED',rate numeric not null check(rate>=0),rate_basis text not null,start_date date not null,message text not null check(length(message) between 10 and 5000),experience text not null,mobilization_days integer not null check(mobilization_days between 0 and 365),terms text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(job_id,applicant_id));
create table public.proposal_items(proposal_id uuid references public.proposals on delete cascade,job_role_id uuid references public.job_roles,quantity integer not null check(quantity between 1 and 1000),primary key(proposal_id,job_role_id));
create table public.deployments(id uuid primary key default gen_random_uuid(),job_id uuid not null references public.jobs,applicant_id uuid not null references public.profiles,application_id uuid unique references public.applications,proposal_id uuid unique references public.proposals,status text not null default 'SELECTED' check(status in ('SELECTED','CONFIRMED','COMPLETED')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(num_nonnulls(application_id,proposal_id)=1));
create table public.deployment_items(deployment_id uuid references public.deployments,job_role_id uuid references public.job_roles,quantity integer not null check(quantity>0),primary key(deployment_id,job_role_id));
create table public.conversations(id uuid primary key default gen_random_uuid(),job_id uuid not null references public.jobs,company_id uuid not null references public.profiles,applicant_id uuid not null references public.profiles,created_at timestamptz not null default now(),unique(job_id,applicant_id));
create table public.conversation_participants(conversation_id uuid references public.conversations on delete cascade,user_id uuid references public.accounts,last_read_at timestamptz not null default now(),primary key(conversation_id,user_id));
create table public.messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.conversations,sender_id uuid not null references public.profiles,body text not null check(length(body) between 1 and 5000),created_at timestamptz not null default now());
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.accounts,title text not null,href text not null,read_at timestamptz,created_at timestamptz not null default now());
create table public.saved_jobs(user_id uuid references public.accounts,job_id uuid references public.jobs,created_at timestamptz not null default now(),primary key(user_id,job_id));
create table public.verification_requests(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles,status text not null default 'PENDING' check(status in ('PENDING','VERIFIED','REJECTED')),notes text not null,admin_notes text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create unique index one_pending_verification on public.verification_requests(user_id) where status='PENDING';
create table public.reports(id uuid primary key default gen_random_uuid(),reporter_id uuid not null references public.accounts,job_id uuid references public.jobs,profile_id uuid references public.profiles,reason text not null,details text not null check(length(details) between 10 and 5000),status text not null default 'OPEN' check(status in ('OPEN','RESOLVED')),created_at timestamptz not null default now(),check(num_nonnulls(job_id,profile_id)=1));
create table public.reviews(id uuid primary key default gen_random_uuid(),deployment_id uuid not null references public.deployments,author_id uuid not null references public.profiles,subject_id uuid not null references public.profiles,rating integer not null check(rating between 1 and 5),body text not null check(length(body) between 5 and 3000),created_at timestamptz not null default now(),unique(deployment_id,author_id),check(author_id<>subject_id));
create table public.attachments(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.accounts,job_id uuid references public.jobs,object_path text not null unique,name text not null,mime_type text not null check(mime_type in ('application/pdf','image/jpeg','image/png')),size_bytes integer not null check(size_bytes between 1 and 5242880),created_at timestamptz not null default now());
create table private.rate_limits(user_id uuid primary key references public.accounts,window_start timestamptz not null,hits integer not null);
alter table public.profiles add column photo_path text not null default '',add column preferred_locations text not null default '',add column elevator_types text not null default '',add column year_established integer not null default 0 check(year_established between 0 and 2100),add column company_size text not null default '',add column contact_person text not null default '';
create table public.profile_history(id uuid primary key default gen_random_uuid(),profile_id uuid not null references public.profiles,kind text not null check(kind in ('EMPLOYMENT','PROJECT','CERTIFICATION','TRAINING','EDUCATION')),title text not null check(length(title) between 2 and 180),organization text not null default '',description text not null default '',year integer not null check(year between 1950 and 2100),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.jobs add column project_type text not null default '',add column elevator_type text not null default '',add column elevator_count integer not null default 0 check(elevator_count between 0 and 10000),add column overtime boolean not null default false,add column overtime_rate numeric not null default 0 check(overtime_rate>=0),add column uniform text not null default 'NO' check(uniform in ('YES','NO','NEGOTIABLE')),add column local_transport text not null default 'NO' check(local_transport in ('YES','NO','NEGOTIABLE')),add column certifications text not null default '',add column documents_required text not null default '',add column preferred_locations text not null default '',add column min_team_size integer not null default 1 check(min_team_size>=1),add column max_team_size integer not null default 10000 check(max_team_size>=min_team_size);
alter table public.job_roles add column certifications text not null default '',add column desired_skills text not null default '',add column budget numeric not null default 0 check(budget>=0);

create function private.active_role() returns public.account_role language sql stable security definer set search_path='' as $$ select role from public.accounts where id=auth.uid() and not suspended $$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select coalesce(private.active_role()='ADMIN',false) $$;
create function private.owns_job(j uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and private.active_role() is not null and exists(select 1 from public.jobs where id=j and owner_id=auth.uid()) $$;
create function private.has_submission(j uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and private.active_role() is not null and (exists(select 1 from public.applications where job_id=j and applicant_id=auth.uid()) or exists(select 1 from public.proposals where job_id=j and applicant_id=auth.uid())) $$;
create function private.profile_visible(p uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.accounts where id=p and (role<>'ADMIN' or id=auth.uid() or private.is_admin())) $$;
create function private.job_visible(j uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.jobs where id=j and ((status not in ('DRAFT','CANCELLED') and exists(select 1 from public.accounts a where a.id=owner_id and not a.suspended)) or private.owns_job(j) or private.is_admin() or private.has_submission(j))) $$;
create function private.in_conversation(c uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and private.active_role() is not null and exists(select 1 from public.conversations where id=c and auth.uid() in (company_id,applicant_id)) $$;
create function private.has_deployment(j uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and private.active_role() is not null and exists(select 1 from public.deployments where job_id=j and applicant_id=auth.uid()) $$;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated,anon;

do $$ declare t text; begin
 foreach t in array array['accounts','industries','categories','worker_roles','skills','profiles','organizations','organization_members','profile_skills','profile_experience','profile_history','jobs','job_private','job_roles','job_skills','applications','proposals','proposal_items','deployments','deployment_items','conversations','conversation_participants','messages','notifications','saved_jobs','verification_requests','reports','reviews','attachments'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to anon,authenticated',t);
 end loop;
end $$;
create policy account_read on public.accounts for select to authenticated using(id=auth.uid() or private.is_admin());
create policy industry_read on public.industries for select using(true);
create policy category_read on public.categories for select using(true);
create policy role_read on public.worker_roles for select using(true);
create policy skill_read on public.skills for select using(true);
create policy profile_read on public.profiles for select using(private.profile_visible(id));
create policy profile_skill_read on public.profile_skills for select using(true);
create policy profile_role_read on public.profile_roles for select using(private.profile_visible(profile_id));
create policy experience_read on public.profile_experience for select using(true);
create policy history_read on public.profile_history for select using(private.profile_visible(profile_id));
create policy org_read on public.organizations for select to authenticated using(owner_id=auth.uid() or private.is_admin());
create policy member_read on public.organization_members for select to authenticated using(user_id=auth.uid() or private.is_admin());
create policy job_read on public.jobs for select using(private.job_visible(id));
create policy private_site_read on public.job_private for select to authenticated using(private.owns_job(job_id) or private.has_deployment(job_id));
create policy job_role_read on public.job_roles for select using(private.job_visible(job_id));
create policy job_skill_read on public.job_skills for select using(private.job_visible(job_id));
create policy application_read on public.applications for select to authenticated using(private.active_role() is not null and (applicant_id=auth.uid() or private.owns_job(job_id)));
create policy proposal_read on public.proposals for select to authenticated using(private.active_role() is not null and (applicant_id=auth.uid() or private.owns_job(job_id)));
create policy proposal_item_read on public.proposal_items for select to authenticated using(exists(select 1 from public.proposals p where p.id=proposal_id));
create policy deployment_read on public.deployments for select to authenticated using(private.active_role() is not null and (applicant_id=auth.uid() or private.owns_job(job_id)));
create policy deployment_item_read on public.deployment_items for select to authenticated using(exists(select 1 from public.deployments d where d.id=deployment_id));
create policy conversation_read on public.conversations for select to authenticated using(private.in_conversation(id));
create policy participant_read on public.conversation_participants for select to authenticated using(private.in_conversation(conversation_id));
create policy message_read on public.messages for select to authenticated using(private.in_conversation(conversation_id));
create policy notification_read on public.notifications for select to authenticated using(user_id=auth.uid() and private.active_role() is not null);
create policy saved_read on public.saved_jobs for select to authenticated using(user_id=auth.uid());
create policy verification_read on public.verification_requests for select to authenticated using(user_id=auth.uid() or private.is_admin());
create policy report_read on public.reports for select to authenticated using(reporter_id=auth.uid() or private.is_admin());
create policy review_read on public.reviews for select using(true);
create policy attachment_read on public.attachments for select to authenticated using(private.active_role() is not null and (owner_id=auth.uid() or private.is_admin() or private.owns_job(job_id) or (private.has_deployment(job_id) and exists(select 1 from public.jobs j where j.id=job_id and j.owner_id=attachments.owner_id))));
create index jobs_discovery on public.jobs(status,city,category_id,start_date);
create index jobs_owner on public.jobs(owner_id);
create index applications_job on public.applications(job_id,status);
create index applications_owner on public.applications(applicant_id);
create index proposals_job on public.proposals(job_id,status);
create index proposals_owner on public.proposals(applicant_id);
create index deployments_job on public.deployments(job_id,applicant_id);
create index messages_conversation on public.messages(conversation_id,created_at);
create index notifications_user on public.notifications(user_id,read_at);
create index profiles_discovery on public.profiles(kind,city,experience);
create index history_profile on public.profile_history(profile_id);

-- Signup role is accepted once from a closed non-admin allowlist. Subsequent
-- authorization uses accounts, never mutable user metadata or UI state.
create function private.on_signup() returns trigger language plpgsql security definer set search_path='' as $$
declare r public.account_role; n text;
begin
 if new.raw_user_meta_data->>'role' not in ('COMPANY','WORKER','VENDOR') then raise exception 'Choose a valid account type'; end if;
 r:=(new.raw_user_meta_data->>'role')::public.account_role;
 if r is null then raise exception 'Account type required'; end if;
 n:=left(coalesce(new.raw_user_meta_data->>'name','New member'),180);
 insert into public.accounts(id,role) values(new.id,r);
 insert into public.profiles(id,kind,name) values(new.id,r,n);
 if r in ('COMPANY','VENDOR') then
 with o as (insert into public.organizations(owner_id,name) values(new.id,n) returning id) insert into public.organization_members(organization_id,user_id) select id,new.id from o;
 end if;
 return new;
end $$;
revoke all on function private.on_signup() from public,anon,authenticated;
create trigger user_created after insert on auth.users for each row execute function private.on_signup();

create function private.notify(u uuid,t text,h text) returns void language sql set search_path='' as $$ insert into public.notifications(user_id,title,href) values(u,t,h) $$;
revoke all on function private.notify(uuid,text,text) from public,anon,authenticated;

create function private.command(c jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.account_role; op text:=c->>'op'; j public.jobs; s record; item jsonb; jr public.job_roles; result_id uuid; target uuid; next_status text; old_status text; kind text; conversation_id uuid; deployment public.deployments; offered integer; lim integer;
begin
 r:=private.active_role();
 if u is null or r is null then raise exception 'Authentication required or account suspended' using errcode='42501'; end if;
 insert into private.rate_limits(user_id,window_start,hits) values(u,now(),1) on conflict(user_id) do update set hits=case when private.rate_limits.window_start<now()-interval '1 minute' then 1 else private.rate_limits.hits+1 end,window_start=case when private.rate_limits.window_start<now()-interval '1 minute' then now() else private.rate_limits.window_start end returning hits into lim;
 if lim>60 then raise exception 'Too many requests. Please wait a minute.'; end if;
 if octet_length(c::text)>100000 then raise exception 'Request too large'; end if;

 if op='profile' then
 update public.profiles set preferred_locations=coalesce(c->>'preferred_locations',''),elevator_types=coalesce(c->>'elevator_types',''),year_established=coalesce((c->>'year_established')::integer,0),company_size=coalesce(c->>'company_size',''),contact_person=coalesce(c->>'contact_person','') where id=u;
 update public.profiles set name=c->>'name',city=c->>'city',state=c->>'state',bio=c->>'bio',experience=(c->>'experience')::integer,primary_role=c->>'primary_role',availability=c->>'availability',expected_rate=(c->>'expected_rate')::numeric,website=coalesce(c->>'website',''),languages=coalesce(c->>'languages',''),brands=coalesce(c->>'brands',''),travel=coalesce((c->>'travel')::boolean,false),team_size=coalesce((c->>'team_size')::integer,0),updated_at=now() where id=u;
 delete from public.profile_skills where profile_id=u;
 delete from public.profile_roles where profile_id=u;
 insert into public.profile_roles(profile_id,role_id) select u,value::text::uuid from jsonb_array_elements_text(coalesce(c->'roles','[]'));
 insert into public.profile_skills(profile_id,skill_id) select u,value::text::uuid from jsonb_array_elements_text(coalesce(c->'skills','[]'));
 update public.organizations set name=c->>'name',phone=coalesce(c->>'phone',''),gst_number=coalesce(c->>'gst_number',''),updated_at=now() where owner_id=u;
 elsif op='history' then
 insert into public.profile_history(profile_id,kind,title,organization,description,year) values(u,c->>'kind',c->>'title',c->>'organization',c->>'description',(c->>'year')::integer);
 elsif op='remove_history' then delete from public.profile_history where id=(c->>'id')::uuid and profile_id=u;
 elsif op='photo' then
 if split_part(c->>'path','/',1)<>u::text then raise exception 'Photo owner mismatch'; end if;
 update public.profiles set photo_path=c->>'path',updated_at=now() where id=u;
 elsif op='create_job' then
 if r<>'COMPANY' then raise exception 'Only companies may post requirements'; end if;
 if coalesce(jsonb_array_length(c->'lines'),0) not between 1 and 20 then raise exception 'Add 1–20 manpower roles'; end if;
 insert into public.jobs(owner_id,organization_id,category_id,title,description,scope,city,state,site_name,start_date,end_date,deadline,duration,shift,hours,rate_basis,min_rate,max_rate,payment_terms,individuals,vendors,accommodation,food,travel,ppe,tools,safety,status)
 values(u,(select id from public.organizations where owner_id=u),(c->>'category_id')::uuid,c->>'title',c->>'description',c->>'scope',c->>'city',c->>'state',c->>'site_name',(c->>'start_date')::date,(c->>'end_date')::date,(c->>'deadline')::date,c->>'duration',c->>'shift',(c->>'hours')::numeric,c->>'rate_basis',(c->>'min_rate')::numeric,(c->>'max_rate')::numeric,c->>'payment_terms',(c->>'individuals')::boolean,(c->>'vendors')::boolean,c->>'accommodation',c->>'food',c->>'travel',c->>'ppe',c->>'tools',c->>'safety',case when (c->>'publish')::boolean then 'OPEN'::public.job_status else 'DRAFT'::public.job_status end) returning id into result_id;
 insert into public.job_private values(result_id,coalesce(c->>'address',''));
 update public.jobs set project_type=coalesce(c->>'project_type',''),elevator_type=coalesce(c->>'elevator_type',''),elevator_count=coalesce((c->>'elevator_count')::integer,0),overtime=coalesce((c->>'overtime')::boolean,false),overtime_rate=coalesce((c->>'overtime_rate')::numeric,0),uniform=coalesce(c->>'uniform','NO'),local_transport=coalesce(c->>'local_transport','NO'),certifications=coalesce(c->>'certifications',''),documents_required=coalesce(c->>'documents_required',''),preferred_locations=coalesce(c->>'preferred_locations',''),min_team_size=coalesce((c->>'min_team_size')::integer,1),max_team_size=coalesce((c->>'max_team_size')::integer,10000) where id=result_id;
 for item in select * from jsonb_array_elements(c->'lines') loop insert into public.job_roles(job_id,role_id,quantity,min_experience,certifications,desired_skills,budget) values(result_id,(item->>'role_id')::uuid,(item->>'quantity')::integer,(item->>'min_experience')::integer,coalesce(item->>'certifications',''),coalesce(item->>'desired_skills',''),coalesce((item->>'budget')::numeric,0)); end loop;
 insert into public.job_skills select result_id,value::text::uuid from jsonb_array_elements_text(c->'skills');
 elsif op='job_status' then
 select * into j from public.jobs where id=(c->>'id')::uuid for update;
 if j.owner_id is distinct from u then raise exception 'Requirement access denied'; end if;
 next_status:=c->>'status';
 if not ((j.status='DRAFT' and next_status in ('OPEN','CANCELLED')) or (j.status='OPEN' and next_status in ('PAUSED','CLOSED','CANCELLED','EXPIRED')) or (j.status='PAUSED' and next_status in ('OPEN','CLOSED','CANCELLED')) or (j.status='CLOSED' and next_status='OPEN') or (j.status in ('OPEN','CLOSED','FILLED','IN_PROGRESS') and next_status='COMPLETED')) then raise exception 'Invalid requirement transition'; end if;
 if next_status='COMPLETED' then
 if not exists(select 1 from public.deployments where job_id=j.id and status='COMPLETED') or exists(select 1 from public.deployments where job_id=j.id and status<>'COMPLETED') then raise exception 'Complete all deployments before closing the engagement'; end if;
 update public.profiles set completed_count=completed_count+1 where id=j.owner_id;
 end if;
 if next_status='CANCELLED' and exists(select 1 from public.deployments where job_id=j.id) then raise exception 'Resolve active deployments before cancellation'; end if;
 update public.jobs set status=next_status::public.job_status,updated_at=now() where id=j.id;
 if next_status='CANCELLED' then insert into public.notifications(user_id,title,href) select applicant_id,'Requirement cancelled: '||j.title,'/dashboard/applications' from public.applications where job_id=j.id union select applicant_id,'Requirement cancelled: '||j.title,'/dashboard/applications' from public.proposals where job_id=j.id; end if;
 elsif op='submit' then
 select * into j from public.jobs where id=(c->>'job_id')::uuid for update;
 if not found or j.status<>'OPEN' or j.deadline<current_date then raise exception 'This requirement is not accepting submissions'; end if;
 if j.owner_id=u then raise exception 'Cannot apply to your own requirement'; end if;
 if (c->>'confirmed')::boolean is distinct from true then raise exception 'Confirm availability'; end if;
 if (c->>'start_date')::date>j.end_date then raise exception 'Availability is after this project ends'; end if;
 if c->>'rate_basis' not in ('DAY','SHIFT','MONTH','HOUR','PROJECT','NEGOTIATED') then raise exception 'Invalid rate basis'; end if;
 kind:=c->>'kind';
 if kind='application' and r='WORKER' and j.individuals then
 select * into jr from public.job_roles where id=(c->>'job_role_id')::uuid and job_id=j.id;
 if not found then raise exception 'Role does not belong to this requirement'; end if;
 if (select experience from public.profiles where id=u)<jr.min_experience then raise exception 'Your profile does not meet the minimum experience for this role'; end if;
 insert into public.applications(job_id,applicant_id,job_role_id,rate,rate_basis,start_date,message,experience) values(j.id,u,jr.id,(c->>'rate')::numeric,c->>'rate_basis',(c->>'start_date')::date,c->>'message',c->>'experience') returning id into result_id;
 elsif kind='proposal' and r='VENDOR' and j.vendors then
 if coalesce(jsonb_array_length(c->'items'),0) not between 1 and 20 then raise exception 'Offer at least one manpower role'; end if;
 if (select sum((value->>'quantity')::integer) from jsonb_array_elements(c->'items')) not between j.min_team_size and j.max_team_size then raise exception 'Team size is outside the requirement limits'; end if;
 insert into public.proposals(job_id,applicant_id,rate,rate_basis,start_date,message,experience,mobilization_days,terms) values(j.id,u,(c->>'rate')::numeric,c->>'rate_basis',(c->>'start_date')::date,c->>'message',c->>'experience',(c->>'mobilization_days')::integer,c->>'terms') returning id into result_id;
 for item in select * from jsonb_array_elements(c->'items') loop
 select * into jr from public.job_roles where id=(item->>'job_role_id')::uuid and job_id=j.id;
 if not found or (item->>'quantity')::integer>jr.quantity then raise exception 'Offered role or quantity is invalid'; end if;
 insert into public.proposal_items values(result_id,jr.id,(item->>'quantity')::integer);
 end loop;
 else raise exception 'Account type is not eligible'; end if;
 insert into public.conversations(job_id,company_id,applicant_id) values(j.id,j.owner_id,u) on conflict(job_id,applicant_id) do update set job_id=excluded.job_id returning id into conversation_id;
 insert into public.conversation_participants(conversation_id,user_id) values(conversation_id,u),(conversation_id,j.owner_id) on conflict do nothing;
 perform private.notify(j.owner_id,'New '||kind||': '||j.title,'/dashboard/applications');
 perform private.notify(u,'Your '||kind||' was received','/dashboard/applications');
 elsif op='submission_status' then
 kind:=c->>'kind'; next_status:=c->>'status';
 if kind='application' then select id,job_id,applicant_id,status::text,job_role_id into s from public.applications where id=(c->>'id')::uuid;
 elsif kind='proposal' then select id,job_id,applicant_id,status::text,null::uuid as job_role_id into s from public.proposals where id=(c->>'id')::uuid;
 else raise exception 'Invalid submission type'; end if;
 if s.id is null then raise exception 'Submission not found'; end if;
 -- Serialize every transition on the parent requirement, then reread status.
 select * into j from public.jobs where id=s.job_id for update;
 if kind='application' then select status::text into old_status from public.applications where id=s.id; else select status::text into old_status from public.proposals where id=s.id; end if;
 if next_status='WITHDRAWN' then
 if s.applicant_id<>u or old_status not in ('APPLIED','SUBMITTED','UNDER_REVIEW','SHORTLISTED','INTERVIEW_REQUESTED','NEGOTIATION') then raise exception 'This submission cannot be withdrawn'; end if;
 else
 if j.owner_id<>u then raise exception 'Submission access denied'; end if;
 if j.status in ('CANCELLED','COMPLETED','EXPIRED') or old_status in ('REJECTED','WITHDRAWN','SELECTED','ACCEPTED','DEPLOYMENT_CONFIRMED','COMPLETED') then raise exception 'Submission is no longer available for this action'; end if;
 if next_status not in ('UNDER_REVIEW','SHORTLISTED','REJECTED','INTERVIEW_REQUESTED','NEGOTIATION','SELECTED','ACCEPTED') then raise exception 'Invalid status'; end if;
 if (kind='application' and next_status in ('NEGOTIATION','ACCEPTED')) or (kind='proposal' and next_status in ('INTERVIEW_REQUESTED','SELECTED')) then raise exception 'Status does not match submission type'; end if;
 end if;
 if next_status in ('SELECTED','ACCEPTED') then
 insert into public.deployments(job_id,applicant_id,application_id,proposal_id) values(j.id,s.applicant_id,case when kind='application' then s.id end,case when kind='proposal' then s.id end) returning id into result_id;
 for item in select jsonb_build_object('role',s.job_role_id,'quantity',1) where kind='application' union all select jsonb_build_object('role',job_role_id,'quantity',quantity) from public.proposal_items where proposal_id=s.id and kind='proposal' loop
 offered:=(item->>'quantity')::integer;
 update public.job_roles set filled=filled+offered where id=(item->>'role')::uuid and job_id=j.id and filled+offered<=quantity returning * into jr;
 if not found then raise exception 'Selection exceeds remaining manpower. No allocation was made.'; end if;
 insert into public.deployment_items values(result_id,jr.id,offered);
 end loop;
 if not exists(select 1 from public.job_roles where job_id=j.id and filled<quantity) then update public.jobs set status='FILLED' where id=j.id and status<>'IN_PROGRESS'; end if;
 end if;
 if kind='application' then update public.applications set status=next_status::public.application_status,updated_at=now() where id=s.id; else update public.proposals set status=next_status::public.proposal_status,updated_at=now() where id=s.id; end if;
 perform private.notify(case when next_status='WITHDRAWN' then j.owner_id else s.applicant_id end,'Submission status: '||replace(next_status,'_',' '),'/dashboard/applications');
 elsif op='deployment' then
 select * into deployment from public.deployments where id=(c->>'id')::uuid for update;
 select * into j from public.jobs where id=deployment.job_id for update;
 if j.owner_id is distinct from u then raise exception 'Deployment access denied'; end if;
 next_status:=c->>'status';
 if not ((deployment.status='SELECTED' and next_status='CONFIRMED') or (deployment.status='CONFIRMED' and next_status='COMPLETED')) then raise exception 'Invalid deployment transition'; end if;
 update public.deployments set status=next_status,updated_at=now() where id=deployment.id;
 update public.applications set status=case when next_status='CONFIRMED' then 'DEPLOYMENT_CONFIRMED'::public.application_status else 'COMPLETED'::public.application_status end where id=deployment.application_id;
 update public.proposals set status=case when next_status='CONFIRMED' then 'DEPLOYMENT_CONFIRMED'::public.proposal_status else 'COMPLETED'::public.proposal_status end where id=deployment.proposal_id;
 if next_status='CONFIRMED' then update public.jobs set status='IN_PROGRESS' where id=j.id; end if;
 if next_status='COMPLETED' then
 update public.profiles set completed_count=completed_count+1 where id=deployment.applicant_id;
 if not exists(select 1 from public.deployments where job_id=j.id and status<>'COMPLETED') and not exists(select 1 from public.job_roles where job_id=j.id and filled<quantity) then update public.jobs set status='COMPLETED' where id=j.id; update public.profiles set completed_count=completed_count+1 where id=j.owner_id; end if;
 end if;
 perform private.notify(deployment.applicant_id,'Deployment '||lower(next_status),'/dashboard/deployments');
 elsif op='message' then
 conversation_id:=(c->>'conversation_id')::uuid;
 if not private.in_conversation(conversation_id) then raise exception 'Conversation access denied'; end if;
 insert into public.messages(conversation_id,sender_id,body) values(conversation_id,u,btrim(c->>'body'));
 select case when company_id=u then applicant_id else company_id end into target from public.conversations where id=conversation_id;
 perform private.notify(target,'New project message','/dashboard/messages');
 elsif op='read_conversation' then
 update public.conversation_participants set last_read_at=now() where conversation_id=(c->>'id')::uuid and user_id=u;
 elsif op='read_notifications' then update public.notifications set read_at=now() where user_id=u and read_at is null;
 elsif op='save' then
 if r not in ('WORKER','VENDOR') then raise exception 'Only workers and vendors may save requirements'; end if;
 if not private.job_visible((c->>'id')::uuid) then raise exception 'Requirement not available'; end if;
 if coalesce((c->>'remove')::boolean,false) then delete from public.saved_jobs where user_id=u and job_id=(c->>'id')::uuid; else insert into public.saved_jobs(user_id,job_id) values(u,(c->>'id')::uuid) on conflict do nothing; end if;
 elsif op='verification' then
 if r not in ('COMPANY','VENDOR') then raise exception 'Only companies and vendors may request verification'; end if;
 insert into public.verification_requests(user_id,notes) values(u,c->>'notes');
 insert into public.notifications(user_id,title,href) select id,'New verification request','/dashboard/admin' from public.accounts where role='ADMIN';
 elsif op='report' then
 insert into public.reports(reporter_id,job_id,profile_id,reason,details) values(u,nullif(c->>'job_id','')::uuid,nullif(c->>'profile_id','')::uuid,c->>'reason',c->>'details');
 insert into public.notifications(user_id,title,href) select id,'New safety report','/dashboard/admin' from public.accounts where role='ADMIN';
 elsif op='review' then
 select * into deployment from public.deployments where id=(c->>'id')::uuid;
 select * into j from public.jobs where id=deployment.job_id;
 if deployment.status is distinct from 'COMPLETED' or u not in (j.owner_id,deployment.applicant_id) then raise exception 'Only completed engagement participants may review'; end if;
 target:=case when u=j.owner_id then deployment.applicant_id else j.owner_id end;
 insert into public.reviews(deployment_id,author_id,subject_id,rating,body) values(deployment.id,u,target,(c->>'rating')::integer,c->>'body');
 update public.profiles set rating=(select round(avg(rating),1) from public.reviews where subject_id=target) where id=target;
 elsif op='admin_stats' then
 if r<>'ADMIN' then raise exception 'Administrator access required'; end if;
 return jsonb_build_object('users',(select count(*) from public.accounts),'companies',(select count(*) from public.accounts where role='COMPANY'),'workers',(select count(*) from public.accounts where role='WORKER'),'vendors',(select count(*) from public.accounts where role='VENDOR'),'applications',(select count(*) from public.applications),'proposals',(select count(*) from public.proposals),'completed',(select count(*) from public.jobs where status='COMPLETED'));
 elsif op='moderate' then
 if r<>'ADMIN' then raise exception 'Administrator access required'; end if;
 if c->>'action'='verify' then
 update public.verification_requests set status=case when (c->>'approve')::boolean then 'VERIFIED' else 'REJECTED' end,admin_notes=c->>'notes',updated_at=now() where id=(c->>'id')::uuid and status='PENDING' returning user_id into target;
 if not found then raise exception 'Pending request not found'; end if;
 update public.profiles set verified=(c->>'approve')::boolean where id=target;
 perform private.notify(target,'Verification request reviewed','/dashboard/profile');
 elsif c->>'action'='suspend' then update public.accounts set suspended=(c->>'suspended')::boolean where id=(c->>'id')::uuid and role<>'ADMIN';
 elsif c->>'action'='close_job' then update public.jobs set status='CLOSED',updated_at=now() where id=(c->>'id')::uuid and status in ('DRAFT','OPEN','PAUSED');
 elsif c->>'action'='resolve' then update public.reports set status='RESOLVED' where id=(c->>'id')::uuid;
 else raise exception 'Unknown moderation action'; end if;
 elsif op='taxonomy' then
 if r<>'ADMIN' or c->>'table' not in ('categories','worker_roles','skills') then raise exception 'Administrator access required'; end if;
 if length(btrim(c->>'name')) not between 2 and 100 then raise exception 'Name must be 2–100 characters'; end if;
 if nullif(c->>'id','') is null then execute format('insert into public.%I(industry_id,name) values($1,$2)',c->>'table') using (c->>'industry_id')::uuid,btrim(c->>'name'); else execute format('update public.%I set name=$1 where id=$2',c->>'table') using btrim(c->>'name'),(c->>'id')::uuid; end if;
 elsif op='attachment' then
 if split_part(c->>'object_path','/',1)<>u::text then raise exception 'Invalid attachment owner'; end if;
 if nullif(c->>'job_id','') is not null and not (private.owns_job((c->>'job_id')::uuid) or exists(select 1 from public.applications where job_id=(c->>'job_id')::uuid and applicant_id=u) or exists(select 1 from public.proposals where job_id=(c->>'job_id')::uuid and applicant_id=u)) then raise exception 'Only project participants may share documents'; end if;
 insert into public.attachments(owner_id,job_id,object_path,name,mime_type,size_bytes) values(u,nullif(c->>'job_id','')::uuid,c->>'object_path',left(c->>'name',180),c->>'mime_type',(c->>'size_bytes')::integer);
 else raise exception 'Unknown operation'; end if;
 return jsonb_build_object('id',result_id,'ok',true);
end $$;
revoke all on function private.command(jsonb) from public,anon;
grant execute on function private.command(jsonb) to authenticated;
create function public.run_command(command jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.command(command) $$;
revoke all on function public.run_command(jsonb) from public,anon;
grant execute on function public.run_command(jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('documents','documents',false,5242880,array['application/pdf','image/jpeg','image/png']);
create policy document_upload on storage.objects for insert to authenticated with check(bucket_id='documents' and (storage.foldername(name))[1]=auth.uid()::text and private.active_role() is not null);
create policy document_read on storage.objects for select to authenticated using(bucket_id='documents' and (private.is_admin() or ((storage.foldername(name))[1]=auth.uid()::text and private.active_role() is not null) or exists(select 1 from public.attachments a where a.object_path=storage.objects.name)));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('profile-media','profile-media',true,2097152,array['image/jpeg','image/png']);
create policy profile_media_upload on storage.objects for insert to authenticated with check(bucket_id='profile-media' and (storage.foldername(name))[1]=auth.uid()::text and private.active_role() is not null);
