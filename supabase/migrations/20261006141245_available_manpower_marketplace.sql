-- Vendor supply-side marketplace. All mutations remain behind run_command;
-- exposed tables are read-only and protected by RLS.
create type public.manpower_listing_status as enum ('ACTIVE','PAUSED','UNAVAILABLE','EXPIRED');
create type public.vendor_invitation_status as enum ('PENDING','VIEWED','PROPOSAL_SUBMITTED','DECLINED','CANCELLED');

create table public.vendor_manpower_listings(
 id uuid primary key default gen_random_uuid(),
 vendor_id uuid not null references public.profiles(id) on delete restrict,
 title text not null check(length(title) between 8 and 180),
 description text not null check(length(description) between 30 and 5000),
 city text not null check(length(city) between 2 and 100),
 state text not null check(length(state) between 2 and 100),
 available_from date not null,
 mobilization_days integer not null default 0 check(mobilization_days between 0 and 365),
 willing_to_travel boolean not null default false,
 minimum_engagement_days integer not null default 0 check(minimum_engagement_days between 0 and 3650),
 rate_type text not null check(rate_type in ('DAY','SHIFT','MONTH','PROJECT','NEGOTIATED')),
 minimum_rate numeric check(minimum_rate is null or minimum_rate >= 0),
 maximum_rate numeric check(maximum_rate is null or maximum_rate >= 0),
 currency text not null default 'INR' check(currency ~ '^[A-Z]{3}$'),
 status public.manpower_listing_status not null default 'PAUSED',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(maximum_rate is null or minimum_rate is null or maximum_rate >= minimum_rate),
 check(rate_type='NEGOTIATED' or (minimum_rate is not null and maximum_rate is not null))
);

create table public.vendor_manpower_listing_items(
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.vendor_manpower_listings(id) on delete cascade,
 worker_role_id uuid not null references public.worker_roles(id) on delete restrict,
 quantity_available integer not null check(quantity_available between 1 and 1000),
 minimum_experience_years numeric not null default 0 check(minimum_experience_years between 0 and 60),
 maximum_experience_years numeric check(maximum_experience_years is null or maximum_experience_years between 0 and 60),
 unique(listing_id,worker_role_id),
 check(maximum_experience_years is null or maximum_experience_years >= minimum_experience_years)
);

create table public.vendor_manpower_listing_categories(
 listing_id uuid not null references public.vendor_manpower_listings(id) on delete cascade,
 category_id uuid not null references public.categories(id) on delete restrict,
 primary key(listing_id,category_id)
);

create table public.vendor_manpower_listing_skills(
 listing_id uuid not null references public.vendor_manpower_listings(id) on delete cascade,
 skill_id uuid not null references public.skills(id) on delete restrict,
 primary key(listing_id,skill_id)
);

create table public.vendor_requirement_invitations(
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.profiles(id) on delete restrict,
 vendor_id uuid not null references public.profiles(id) on delete restrict,
 manpower_listing_id uuid not null references public.vendor_manpower_listings(id) on delete restrict,
 requirement_id uuid not null references public.jobs(id) on delete restrict,
 status public.vendor_invitation_status not null default 'PENDING',
 created_at timestamptz not null default now(),
 responded_at timestamptz,
 check(company_id <> vendor_id)
);

create unique index vendor_invitation_active_unique
 on public.vendor_requirement_invitations(company_id,vendor_id,manpower_listing_id,requirement_id)
 where status in ('PENDING','VIEWED','PROPOSAL_SUBMITTED');
create index manpower_listing_marketplace
 on public.vendor_manpower_listings(status,city,state,available_from,created_at desc);
create index manpower_listing_vendor
 on public.vendor_manpower_listings(vendor_id,status,updated_at desc);
create index manpower_item_role
 on public.vendor_manpower_listing_items(worker_role_id,listing_id);
create index manpower_category_lookup
 on public.vendor_manpower_listing_categories(category_id,listing_id);
create index manpower_skill_lookup
 on public.vendor_manpower_listing_skills(skill_id,listing_id);
create index vendor_invitation_vendor
 on public.vendor_requirement_invitations(vendor_id,status,created_at desc);
create index vendor_invitation_company
 on public.vendor_requirement_invitations(company_id,status,created_at desc);
create index vendor_invitation_requirement
 on public.vendor_requirement_invitations(requirement_id,status);

create function private.manpower_listing_visible(listing uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
 select exists(
  select 1
  from public.vendor_manpower_listings l
  where l.id=listing
    and (
      (l.status='ACTIVE' and exists(select 1 from public.accounts a where a.id=l.vendor_id and not a.suspended))
      or l.vendor_id=(select auth.uid())
      or private.is_admin()
      or exists(
        select 1 from public.vendor_requirement_invitations i
        where i.manpower_listing_id=l.id and i.company_id=(select auth.uid())
      )
    )
 )
$$;
revoke all on function private.manpower_listing_visible(uuid) from public;
grant execute on function private.manpower_listing_visible(uuid) to anon,authenticated;

alter table public.vendor_manpower_listings enable row level security;
alter table public.vendor_manpower_listing_items enable row level security;
alter table public.vendor_manpower_listing_categories enable row level security;
alter table public.vendor_manpower_listing_skills enable row level security;
alter table public.vendor_requirement_invitations enable row level security;

revoke all on public.vendor_manpower_listings from anon,authenticated;
revoke all on public.vendor_manpower_listing_items from anon,authenticated;
revoke all on public.vendor_manpower_listing_categories from anon,authenticated;
revoke all on public.vendor_manpower_listing_skills from anon,authenticated;
revoke all on public.vendor_requirement_invitations from anon,authenticated;
grant select on public.vendor_manpower_listings to anon,authenticated;
grant select on public.vendor_manpower_listing_items to anon,authenticated;
grant select on public.vendor_manpower_listing_categories to anon,authenticated;
grant select on public.vendor_manpower_listing_skills to anon,authenticated;
grant select on public.vendor_requirement_invitations to authenticated;

create policy manpower_listing_read on public.vendor_manpower_listings
 for select to anon,authenticated
 using ((select private.manpower_listing_visible(id)));
create policy manpower_item_read on public.vendor_manpower_listing_items
 for select to anon,authenticated
 using ((select private.manpower_listing_visible(listing_id)));
create policy manpower_category_read on public.vendor_manpower_listing_categories
 for select to anon,authenticated
 using ((select private.manpower_listing_visible(listing_id)));
create policy manpower_skill_read on public.vendor_manpower_listing_skills
 for select to anon,authenticated
 using ((select private.manpower_listing_visible(listing_id)));
create policy vendor_invitation_read on public.vendor_requirement_invitations
 for select to authenticated
 using (
  private.active_role() is not null
  and (company_id=(select auth.uid()) or vendor_id=(select auth.uid()) or private.is_admin())
 );

create function private.manpower_command(c jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 u uuid:=(select auth.uid());
 r public.account_role;
 op text:=c->>'op';
 listing public.vendor_manpower_listings;
 invitation public.vendor_requirement_invitations;
 requirement public.jobs;
 item jsonb;
 result_id uuid;
 conversation_id uuid;
 company_name text;
 requested_status public.manpower_listing_status;
begin
 r:=private.active_role();
 if u is null or r is null then
  raise exception 'Authentication required or account suspended' using errcode='42501';
 end if;
 if octet_length(c::text)>100000 then raise exception 'Request too large'; end if;

 if op='manpower_listing' then
  if r<>'VENDOR' then raise exception 'Only vendors may manage manpower listings'; end if;
  if coalesce(jsonb_array_length(c->'items'),0) not between 1 and 20 then
   raise exception 'Add 1–20 manpower roles';
  end if;
  if coalesce(jsonb_array_length(c->'categories'),0)>30 or coalesce(jsonb_array_length(c->'skills'),0)>30 then
   raise exception 'Choose no more than 30 categories or skills';
  end if;
  if c->>'rate_type'<>'NEGOTIATED' and (nullif(c->>'minimum_rate','') is null or nullif(c->>'maximum_rate','') is null) then
   raise exception 'Enter a minimum and maximum rate';
  end if;
  if nullif(c->>'id','') is null then
   insert into public.vendor_manpower_listings(
    vendor_id,title,description,city,state,available_from,mobilization_days,
    willing_to_travel,minimum_engagement_days,rate_type,minimum_rate,maximum_rate,currency,status
   ) values(
    u,btrim(c->>'title'),btrim(c->>'description'),btrim(c->>'city'),btrim(c->>'state'),
    (c->>'available_from')::date,(c->>'mobilization_days')::integer,
    (c->>'willing_to_travel')::boolean,(c->>'minimum_engagement_days')::integer,
    c->>'rate_type',nullif(c->>'minimum_rate','')::numeric,nullif(c->>'maximum_rate','')::numeric,
    coalesce(nullif(c->>'currency',''),'INR'),
    case when (c->>'publish')::boolean then 'ACTIVE'::public.manpower_listing_status else 'PAUSED'::public.manpower_listing_status end
   ) returning id into result_id;
  else
   select * into listing from public.vendor_manpower_listings where id=(c->>'id')::uuid for update;
   if not found or listing.vendor_id<>u then raise exception 'Manpower listing access denied'; end if;
   result_id:=listing.id;
   update public.vendor_manpower_listings set
    title=btrim(c->>'title'),description=btrim(c->>'description'),city=btrim(c->>'city'),state=btrim(c->>'state'),
    available_from=(c->>'available_from')::date,mobilization_days=(c->>'mobilization_days')::integer,
    willing_to_travel=(c->>'willing_to_travel')::boolean,
    minimum_engagement_days=(c->>'minimum_engagement_days')::integer,rate_type=c->>'rate_type',
    minimum_rate=nullif(c->>'minimum_rate','')::numeric,maximum_rate=nullif(c->>'maximum_rate','')::numeric,
    currency=coalesce(nullif(c->>'currency',''),'INR'),updated_at=now()
   where id=result_id;
   delete from public.vendor_manpower_listing_items where listing_id=result_id;
   delete from public.vendor_manpower_listing_categories where listing_id=result_id;
   delete from public.vendor_manpower_listing_skills where listing_id=result_id;
  end if;
  for item in select * from jsonb_array_elements(c->'items') loop
   insert into public.vendor_manpower_listing_items(
    listing_id,worker_role_id,quantity_available,minimum_experience_years,maximum_experience_years
   ) values(
    result_id,(item->>'worker_role_id')::uuid,(item->>'quantity_available')::integer,
    (item->>'minimum_experience_years')::numeric,nullif(item->>'maximum_experience_years','')::numeric
   );
  end loop;
  insert into public.vendor_manpower_listing_categories(listing_id,category_id)
   select result_id,value::text::uuid from jsonb_array_elements_text(coalesce(c->'categories','[]'::jsonb));
  insert into public.vendor_manpower_listing_skills(listing_id,skill_id)
   select result_id,value::text::uuid from jsonb_array_elements_text(coalesce(c->'skills','[]'::jsonb));

 elsif op='manpower_status' then
  select * into listing from public.vendor_manpower_listings where id=(c->>'id')::uuid for update;
  if not found or (listing.vendor_id<>u and r<>'ADMIN') then raise exception 'Manpower listing access denied'; end if;
  requested_status:=(c->>'status')::public.manpower_listing_status;
  if requested_status not in ('ACTIVE','PAUSED','UNAVAILABLE') then raise exception 'Invalid manpower listing status'; end if;
  update public.vendor_manpower_listings set status=requested_status,updated_at=now() where id=listing.id;
  result_id:=listing.id;

 elsif op='duplicate_manpower' then
  if r<>'VENDOR' then raise exception 'Only vendors may duplicate manpower listings'; end if;
  select * into listing from public.vendor_manpower_listings where id=(c->>'id')::uuid and vendor_id=u;
  if not found then raise exception 'Manpower listing access denied'; end if;
  insert into public.vendor_manpower_listings(
   vendor_id,title,description,city,state,available_from,mobilization_days,willing_to_travel,
   minimum_engagement_days,rate_type,minimum_rate,maximum_rate,currency,status
  ) values(
   u,left(listing.title||' (copy)',180),listing.description,listing.city,listing.state,listing.available_from,
   listing.mobilization_days,listing.willing_to_travel,listing.minimum_engagement_days,listing.rate_type,
   listing.minimum_rate,listing.maximum_rate,listing.currency,'PAUSED'
  ) returning id into result_id;
  insert into public.vendor_manpower_listing_items(listing_id,worker_role_id,quantity_available,minimum_experience_years,maximum_experience_years)
   select result_id,worker_role_id,quantity_available,minimum_experience_years,maximum_experience_years
   from public.vendor_manpower_listing_items where listing_id=listing.id;
  insert into public.vendor_manpower_listing_categories select result_id,category_id from public.vendor_manpower_listing_categories where listing_id=listing.id;
  insert into public.vendor_manpower_listing_skills select result_id,skill_id from public.vendor_manpower_listing_skills where listing_id=listing.id;

 elsif op='invite_vendor' then
  if r<>'COMPANY' then raise exception 'Only companies may invite manpower vendors'; end if;
  select * into listing from public.vendor_manpower_listings where id=(c->>'listing_id')::uuid for update;
  if not found or listing.status<>'ACTIVE' then raise exception 'This manpower listing is not available'; end if;
  select * into requirement from public.jobs
   where id=(c->>'requirement_id')::uuid and owner_id=u and status='OPEN' and deadline>=current_date and vendors
   for update;
  if not found then raise exception 'Choose one of your open vendor requirements'; end if;
  insert into public.vendor_requirement_invitations(company_id,vendor_id,manpower_listing_id,requirement_id)
   values(u,listing.vendor_id,listing.id,requirement.id) returning id into result_id;
  insert into public.conversations(job_id,company_id,applicant_id)
   values(requirement.id,u,listing.vendor_id)
   on conflict(job_id,applicant_id) do update set job_id=excluded.job_id returning id into conversation_id;
  insert into public.conversation_participants(conversation_id,user_id)
   values(conversation_id,u),(conversation_id,listing.vendor_id) on conflict do nothing;
  select name into company_name from public.profiles where id=u;
  perform private.notify(
   listing.vendor_id,
   company_name||' invited you to submit manpower for '||requirement.title||'.',
   '/dashboard/invitations?invitation='||result_id::text
  );

 elsif op='invitation_status' then
  select * into invitation from public.vendor_requirement_invitations where id=(c->>'id')::uuid for update;
  if not found then raise exception 'Invitation not found'; end if;
  if r='VENDOR' and invitation.vendor_id=u and c->>'status' in ('VIEWED','DECLINED') then
   if invitation.status not in ('PENDING','VIEWED') then raise exception 'Invitation is no longer available'; end if;
  elsif r='COMPANY' and invitation.company_id=u and c->>'status'='CANCELLED' then
   if invitation.status not in ('PENDING','VIEWED') then raise exception 'Invitation is no longer available'; end if;
  else
   raise exception 'Invitation access denied';
  end if;
  update public.vendor_requirement_invitations set
   status=(c->>'status')::public.vendor_invitation_status,
   responded_at=case when c->>'status' in ('DECLINED','CANCELLED') then now() else responded_at end
  where id=invitation.id;
  result_id:=invitation.id;
 else
  raise exception 'Unknown manpower operation';
 end if;
 return jsonb_build_object('id',result_id,'ok',true);
end $$;
revoke all on function private.manpower_command(jsonb) from public,anon;
grant execute on function private.manpower_command(jsonb) to authenticated;

create function private.complete_invited_proposal(target_requirement_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
 u uuid:=(select auth.uid());
 requirement public.jobs;
 vendor_name text;
 updated_invitations integer;
begin
 if u is null or not exists(
  select 1 from public.proposals where job_id=target_requirement_id and applicant_id=u
 ) then
  raise exception 'Proposal access denied';
 end if;
 update public.vendor_requirement_invitations
  set status='PROPOSAL_SUBMITTED',responded_at=now()
  where vendor_id=u and requirement_id=target_requirement_id
    and status in ('PENDING','VIEWED');
 get diagnostics updated_invitations=row_count;
 if updated_invitations>0 then
  select * into requirement from public.jobs where id=target_requirement_id;
  select name into vendor_name from public.profiles where id=u;
  update public.notifications set title=vendor_name||' submitted a proposal for your invited requirement: '||requirement.title||'.'
  where id=(
   select id from public.notifications
   where user_id=requirement.owner_id and title='New proposal: '||requirement.title
   order by created_at desc limit 1
  );
 end if;
end $$;
revoke all on function private.complete_invited_proposal(uuid) from public,anon;
grant execute on function private.complete_invited_proposal(uuid) to authenticated;

create or replace function public.run_command(command jsonb)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $$
declare
 result jsonb;
begin
 if command->>'op' in ('manpower_listing','manpower_status','duplicate_manpower','invite_vendor','invitation_status') then
  return private.manpower_command(command);
 end if;
 result:=private.command(command);
 if command->>'op'='submit' and command->>'kind'='proposal' then
  perform private.complete_invited_proposal((command->>'job_id')::uuid);
 end if;
 return result;
end $$;
revoke all on function public.run_command(jsonb) from public,anon;
grant execute on function public.run_command(jsonb) to authenticated;
