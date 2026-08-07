begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  username text unique,
  role text not null default 'Member' check (role in ('Super Admin', 'Admin', 'Manager', 'Member', 'Guest')),
  title text,
  phone text,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'suspended', 'invited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_profile_email_from_auth on auth.users;
create trigger sync_profile_email_from_auth
after update of email on auth.users
for each row execute function public.sync_profile_email_from_auth();
revoke all on function public.sync_profile_email_from_auth() from public, anon, authenticated;

create table if not exists public.organizations (
  id text primary key,
  name text not null,
  description text,
  logo_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Member' check (role in ('Super Admin', 'Admin', 'Manager', 'Member', 'Guest')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.channels (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_private boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.channel_members (
  channel_id text not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create table if not exists public.conversations (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  title text,
  is_group boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id text not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  channel_id text references public.channels(id) on delete cascade,
  conversation_id text references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  parent_message_id text references public.messages(id) on delete cascade,
  content text not null,
  attachments jsonb not null default '[]'::jsonb,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((channel_id is not null)::int + (conversation_id is not null)::int = 1)
);

create table if not exists public.message_reactions (
  message_id text not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.message_reads (
  message_id text not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message_id text not null references public.messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, message_id)
);

create table if not exists public.tasks (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed', 'blocked')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date timestamptz,
  source_message_id text references public.messages(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  social_handles jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  title text not null,
  contact_id text references public.contacts(id) on delete cascade,
  value numeric(12,2) not null default 0,
  currency text not null default 'USD',
  stage text not null default 'Lead',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.canvases (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  title text not null,
  content text,
  channel_id text references public.channels(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.file_assets (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  filename text not null,
  file_size integer not null,
  mime_type text not null,
  file_url text not null,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null,
  source_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.agents (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  name text not null,
  username text unique not null,
  email text unique not null,
  model text not null default 'gpt-4o-mini',
  api_base_url text not null default 'https://api.openai.com/v1',
  job_details text not null,
  personality text not null,
  can_read_organizations boolean not null default true,
  can_read_public_threads boolean not null default true,
  can_search_web boolean not null default false,
  enabled boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.agent_secrets (
  agent_id text primary key references public.agents(id) on delete cascade,
  encrypted_api_key text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.system_audit_logs (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details text,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists channels_organization_idx on public.channels(organization_id);
create index if not exists messages_channel_created_idx on public.messages(channel_id, created_at);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index if not exists messages_parent_idx on public.messages(parent_message_id);
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists channel_members_user_idx on public.channel_members(user_id);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id);

create or replace function private.is_organization_member(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id and user_id = auth.uid()
  );
$$;

create or replace function private.profile_role_unchanged(target_user_id uuid, proposed_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = target_user_id and id = auth.uid() and role = proposed_role
  );
$$;

create or replace function private.is_global_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Super Admin'
  );
$$;

create or replace function private.is_organization_creator(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizations
    where id = target_organization_id and created_by = auth.uid()
  );
$$;

create or replace function private.is_organization_admin(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and role in ('Super Admin', 'Admin')
  );
$$;

create or replace function private.can_access_channel(target_channel_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.channels c
    where c.id = target_channel_id
      and private.is_organization_member(c.organization_id)
      and (
        c.is_private = false
        or exists (select 1 from public.channel_members cm where cm.channel_id = c.id and cm.user_id = auth.uid())
        or private.is_organization_admin(c.organization_id)
      )
  );
$$;

create or replace function private.can_access_conversation(target_conversation_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = target_conversation_id and user_id = auth.uid()
  );
$$;

create or replace function private.can_manage_conversation(target_conversation_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations
    where id = target_conversation_id and created_by = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_reads enable row level security;
alter table public.saved_items enable row level security;
alter table public.tasks enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.canvases enable row level security;
alter table public.file_assets enable row level security;
alter table public.agents enable row level security;
alter table public.system_audit_logs enable row level security;

-- Re-running this migration replaces the policies without duplicating them.
do $$
declare policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in (
      'profiles','organizations','organization_members','channels','channel_members','conversations',
      'conversation_members','messages','message_reactions','message_reads','saved_items','tasks','contacts',
      'deals','canvases','file_assets','agents','system_audit_logs'
    )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

create policy profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or exists (
  select 1 from public.organization_members theirs
  where theirs.user_id = profiles.id
    and private.is_organization_member(theirs.organization_id)
));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and private.profile_role_unchanged(id, role));

create policy organizations_member_select on public.organizations for select to authenticated using (private.is_organization_member(id));
create policy organizations_super_admin_insert on public.organizations for insert to authenticated
with check (created_by = auth.uid() and private.is_global_super_admin());
create policy organizations_admin_update on public.organizations for update to authenticated
using (private.is_organization_admin(id)) with check (private.is_organization_admin(id));
create policy organizations_admin_delete on public.organizations for delete to authenticated
using (private.is_organization_admin(id));

create policy organization_members_member_select on public.organization_members for select to authenticated using (private.is_organization_member(organization_id));
create policy organization_members_admin_insert on public.organization_members for insert to authenticated
with check (private.is_organization_admin(organization_id) or private.is_organization_creator(organization_id));
create policy organization_members_admin_update on public.organization_members for update to authenticated
using (private.is_organization_admin(organization_id)) with check (private.is_organization_admin(organization_id));
create policy organization_members_admin_delete on public.organization_members for delete to authenticated
using (private.is_organization_admin(organization_id));

create policy channels_member_select on public.channels for select to authenticated using (private.can_access_channel(id));
create policy channels_admin_insert on public.channels for insert to authenticated with check (private.is_organization_admin(organization_id));
create policy channels_admin_update on public.channels for update to authenticated using (private.is_organization_admin(organization_id)) with check (private.is_organization_admin(organization_id));
create policy channels_admin_delete on public.channels for delete to authenticated using (private.is_organization_admin(organization_id));

create policy channel_members_select on public.channel_members for select to authenticated using (private.can_access_channel(channel_id));
create policy channel_members_admin_write on public.channel_members for all to authenticated
using (exists (select 1 from public.channels c where c.id = channel_id and private.is_organization_admin(c.organization_id)))
with check (exists (select 1 from public.channels c where c.id = channel_id and private.is_organization_admin(c.organization_id)));

create policy conversations_member_select on public.conversations for select to authenticated using (private.can_access_conversation(id));
create policy conversations_member_insert on public.conversations for insert to authenticated with check (private.is_organization_member(organization_id) and created_by = auth.uid());
create policy conversation_members_select on public.conversation_members for select to authenticated using (private.can_access_conversation(conversation_id));
create policy conversation_members_insert on public.conversation_members for insert to authenticated with check (
  user_id = auth.uid() or private.can_manage_conversation(conversation_id)
);

create policy messages_select on public.messages for select to authenticated using (
  private.is_organization_member(organization_id)
  and ((channel_id is not null and private.can_access_channel(channel_id)) or (conversation_id is not null and private.can_access_conversation(conversation_id)))
);
create policy messages_insert on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and private.is_organization_member(organization_id)
  and ((channel_id is not null and private.can_access_channel(channel_id)) or (conversation_id is not null and private.can_access_conversation(conversation_id)))
);
create policy messages_author_update on public.messages for update to authenticated
using (
  sender_id = auth.uid()
  and private.is_organization_member(organization_id)
  and ((channel_id is not null and private.can_access_channel(channel_id)) or (conversation_id is not null and private.can_access_conversation(conversation_id)))
)
with check (
  sender_id = auth.uid()
  and private.is_organization_member(organization_id)
  and ((channel_id is not null and private.can_access_channel(channel_id)) or (conversation_id is not null and private.can_access_conversation(conversation_id)))
);
create policy messages_author_delete on public.messages for delete to authenticated using (sender_id = auth.uid() or private.is_organization_admin(organization_id));

create policy reactions_visible_message on public.message_reactions for select to authenticated using (exists (select 1 from public.messages m where m.id = message_id));
create policy reactions_own_insert on public.message_reactions for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.messages m where m.id = message_id));
create policy reactions_own_delete on public.message_reactions for delete to authenticated using (user_id = auth.uid());
create policy reads_own on public.message_reads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_items_own on public.saved_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and private.is_organization_member(organization_id));

create policy tasks_member_select on public.tasks for select to authenticated using (private.is_organization_member(organization_id));
create policy tasks_member_insert on public.tasks for insert to authenticated with check (creator_id = auth.uid() and private.is_organization_member(organization_id));
create policy tasks_participant_update on public.tasks for update to authenticated using (creator_id = auth.uid() or assignee_id = auth.uid() or private.is_organization_admin(organization_id));
create policy tasks_admin_delete on public.tasks for delete to authenticated using (creator_id = auth.uid() or private.is_organization_admin(organization_id));

create policy contacts_member_all on public.contacts for all to authenticated using (private.is_organization_member(organization_id)) with check (private.is_organization_member(organization_id));
create policy deals_member_all on public.deals for all to authenticated using (private.is_organization_member(organization_id)) with check (private.is_organization_member(organization_id));
create policy canvases_member_all on public.canvases for all to authenticated using (private.is_organization_member(organization_id)) with check (private.is_organization_member(organization_id));
create policy files_member_select on public.file_assets for select to authenticated using (private.is_organization_member(organization_id));
create policy files_member_insert on public.file_assets for insert to authenticated with check (uploader_id = auth.uid() and private.is_organization_member(organization_id));
create policy agents_member_select on public.agents for select to authenticated using (private.is_organization_member(organization_id));
create policy agents_admin_write on public.agents for all to authenticated using (private.is_organization_admin(organization_id)) with check (private.is_organization_admin(organization_id));
create policy audit_admin_select on public.system_audit_logs for select to authenticated using (private.is_organization_admin(organization_id));

revoke all on schema private from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

-- Auth users must be created with the Admin API before this migration is applied.
do $$
declare missing_emails text;
begin
  select string_agg(seed.email, ', ' order by seed.email) into missing_emails
  from (values
    ('abdallah@democompany.com'),('john.doe@democompany.com'),('esraa@democompany.com'),
    ('sarah@democompany.com'),('omar.hitman2010@gmail.com'),('guest@democompany.com')
  ) seed(email)
  left join auth.users auth_user on auth_user.email = seed.email
  where auth_user.id is null;
  if missing_emails is not null then
    raise exception 'Create the missing confirmed DeskFlow Auth users before applying this migration: %', missing_emails;
  end if;
end $$;

insert into public.profiles (id, name, email, username, role, title, phone, avatar_url, status)
select auth_user.id, seed.name, seed.email, seed.username, seed.role, seed.title, seed.phone, seed.avatar_url, 'active'
from (values
  ('abdallah@democompany.com','Abdallah Sayed','abdallah','Super Admin','CEO','+1000222333','https://i.pravatar.cc/150?u=abdallah'),
  ('john.doe@democompany.com','John Doe','john.doe','Member','Developer','+1234567890','https://i.pravatar.cc/150?u=john.doe'),
  ('esraa@democompany.com','Esraa Hassan','esraa','Admin','Operations Manager','+1234567891','https://i.pravatar.cc/150?u=esraa'),
  ('sarah@democompany.com','Sarah Ahmed','sarah','Manager','Customer Success Manager','+1234567892','https://i.pravatar.cc/150?u=sarah'),
  ('omar.hitman2010@gmail.com','Omar Adeel','omar','Super Admin','Product Designer','+1234567893','https://i.pravatar.cc/150?u=omar'),
  ('guest@democompany.com','Guest User','guest','Guest','Guest','','https://i.pravatar.cc/150?u=guest')
) seed(email,name,username,role,title,phone,avatar_url)
join auth.users auth_user on auth_user.email = seed.email
on conflict (id) do update set name = excluded.name, username = excluded.username, role = excluded.role, title = excluded.title, phone = excluded.phone, avatar_url = excluded.avatar_url, updated_at = now();

insert into public.organizations (id, name, description, created_by)
select 'org_demo_company', 'Demo Company', 'The primary DeskFlow demonstration workspace.', id from public.profiles where email = 'abdallah@democompany.com'
on conflict (id) do update set name = excluded.name, description = excluded.description;

insert into public.organization_members (organization_id, user_id, role)
select 'org_demo_company', id, role from public.profiles
where email in ('abdallah@democompany.com','john.doe@democompany.com','esraa@democompany.com','sarah@democompany.com','omar.hitman2010@gmail.com','guest@democompany.com')
on conflict (organization_id, user_id) do update set role = excluded.role;

insert into public.organizations (id, name, description, created_by)
select 'org_northstar', 'Northstar Labs', 'A separate workspace used to demonstrate multi-organization isolation.', id
from public.profiles where email = 'abdallah@democompany.com'
on conflict (id) do update set name = excluded.name, description = excluded.description;

insert into public.organization_members (organization_id, user_id, role)
select 'org_northstar', id,
  case when email in ('abdallah@democompany.com', 'omar.hitman2010@gmail.com') then 'Super Admin' else 'Member' end
from public.profiles
where email in ('abdallah@democompany.com','john.doe@democompany.com','omar.hitman2010@gmail.com')
on conflict (organization_id, user_id) do update set role = excluded.role;

insert into public.channels (id, organization_id, name, description, is_private, created_by) values
('chn_general','org_demo_company','general','Company-wide announcements and everyday conversation.',false,(select id from public.profiles where email='abdallah@democompany.com')),
('chn_product','org_demo_company','product','Product planning, launches, and customer feedback.',false,(select id from public.profiles where email='john.doe@democompany.com')),
('chn_customer_ops','org_demo_company','customer-ops','Support escalations and customer operations.',false,(select id from public.profiles where email='esraa@democompany.com')),
('chn_leadership','org_demo_company','leadership','Private leadership planning and decisions.',true,(select id from public.profiles where email='abdallah@democompany.com')),
('chn_northstar_general','org_northstar','general','Northstar workspace updates and announcements.',false,(select id from public.profiles where email='abdallah@democompany.com')),
('chn_northstar_launch','org_northstar','launch-room','Private launch coordination for Northstar members.',true,(select id from public.profiles where email='abdallah@democompany.com'))
on conflict (id) do update set name=excluded.name, description=excluded.description, is_private=excluded.is_private;

insert into public.channel_members (channel_id, user_id)
select membership.channel_id, profile.id
from (values
('chn_general','abdallah@democompany.com'),('chn_general','john.doe@democompany.com'),('chn_general','esraa@democompany.com'),('chn_general','sarah@democompany.com'),('chn_general','omar.hitman2010@gmail.com'),
('chn_product','abdallah@democompany.com'),('chn_product','john.doe@democompany.com'),('chn_product','omar.hitman2010@gmail.com'),
('chn_customer_ops','abdallah@democompany.com'),('chn_customer_ops','esraa@democompany.com'),('chn_customer_ops','sarah@democompany.com'),
('chn_leadership','abdallah@democompany.com'),('chn_leadership','esraa@democompany.com'),('chn_leadership','sarah@democompany.com'),
('chn_northstar_general','abdallah@democompany.com'),('chn_northstar_general','john.doe@democompany.com'),('chn_northstar_general','omar.hitman2010@gmail.com'),
('chn_northstar_launch','abdallah@democompany.com'),('chn_northstar_launch','omar.hitman2010@gmail.com')
) as membership(channel_id,email)
join public.profiles profile on profile.email=membership.email
on conflict do nothing;

insert into public.messages (id,organization_id,channel_id,sender_id,content,is_pinned,created_at) values
('msg_general_welcome','org_demo_company','chn_general',(select id from public.profiles where email='abdallah@democompany.com'),'Welcome to the Demo Company workspace! Please share updates and wins here.',true,'2026-08-01T09:00:00Z'),
('msg_product_launch','org_demo_company','chn_product',(select id from public.profiles where email='john.doe@democompany.com'),'The new workspace navigation prototype is ready for review.',false,'2026-08-03T14:30:00Z'),
('msg_ops_escalation','org_demo_company','chn_customer_ops',(select id from public.profiles where email='sarah@democompany.com'),'The Acme billing escalation is resolved. I added the follow-up checklist below.',true,'2026-08-04T11:15:00Z'),
('msg_leadership_plan','org_demo_company','chn_leadership',(select id from public.profiles where email='esraa@democompany.com'),'Quarterly planning review is scheduled for Friday at 10:00.',false,'2026-08-05T16:00:00Z'),
('msg_northstar_welcome','org_northstar','chn_northstar_general',(select id from public.profiles where email='abdallah@democompany.com'),'Welcome to Northstar Labs. This channel and its history are isolated from Demo Company.',true,'2026-08-06T12:00:00Z'),
('msg_northstar_launch','org_northstar','chn_northstar_launch',(select id from public.profiles where email='omar.hitman2010@gmail.com'),'The launch checklist is ready for the private workspace review.',false,'2026-08-06T13:00:00Z')
on conflict (id) do update set content=excluded.content;

insert into public.messages (id,organization_id,channel_id,sender_id,parent_message_id,content,created_at) values
('msg_product_reply','org_demo_company','chn_product',(select id from public.profiles where email='omar.hitman2010@gmail.com'),'msg_product_launch','I will review the responsive states and leave notes by tomorrow.','2026-08-03T15:05:00Z'),
('msg_ops_reply','org_demo_company','chn_customer_ops',(select id from public.profiles where email='esraa@democompany.com'),'msg_ops_escalation','Thanks Sarah. I will confirm the customer handoff and close the task.','2026-08-04T11:35:00Z')
on conflict (id) do update set content=excluded.content;

insert into public.conversations (id,organization_id,created_by) values
('dm_abdallah_john','org_demo_company',(select id from public.profiles where email='abdallah@democompany.com')),
('dm_abdallah_esraa','org_demo_company',(select id from public.profiles where email='abdallah@democompany.com'))
on conflict (id) do nothing;
insert into public.conversation_members (conversation_id,user_id)
select pair.conversation_id, profile.id from (values
('dm_abdallah_john','abdallah@democompany.com'),('dm_abdallah_john','john.doe@democompany.com'),
('dm_abdallah_esraa','abdallah@democompany.com'),('dm_abdallah_esraa','esraa@democompany.com')) pair(conversation_id,email)
join public.profiles profile on profile.email=pair.email on conflict do nothing;
insert into public.messages (id,organization_id,conversation_id,sender_id,content,created_at) values
('dm_msg_john_1','org_demo_company','dm_abdallah_john',(select id from public.profiles where email='john.doe@democompany.com'),'The product review is ready whenever you are.','2026-08-06T09:30:00Z'),
('dm_msg_esraa_1','org_demo_company','dm_abdallah_esraa',(select id from public.profiles where email='esraa@democompany.com'),'Customer operations metrics are updated for this week.','2026-08-06T10:15:00Z')
on conflict (id) do update set content=excluded.content;

insert into public.tasks (id,organization_id,title,description,status,priority,creator_id,assignee_id,due_date,source_message_id) values
('tsk_navigation_review','org_demo_company','Review navigation prototype','Check desktop and mobile states and consolidate feedback.','in_progress','high',(select id from public.profiles where email='john.doe@democompany.com'),(select id from public.profiles where email='omar.hitman2010@gmail.com'),'2026-08-08T17:00:00Z','msg_product_launch'),
('tsk_acme_handoff','org_demo_company','Complete Acme billing handoff','Share the resolved escalation summary with the account owner.','todo','urgent',(select id from public.profiles where email='sarah@democompany.com'),(select id from public.profiles where email='esraa@democompany.com'),'2026-08-07T17:00:00Z','msg_ops_escalation')
on conflict (id) do update set status=excluded.status, priority=excluded.priority;

insert into public.contacts (id,organization_id,name,email,phone,company,social_handles,notes) values
('con_acme','org_demo_company','Maya Patel','maya.patel@acme.example','+1-555-0200','Acme Corporation','{"whatsapp":"+1-555-0200","linkedin":"maya-patel"}','Primary contact for the billing expansion.'),
('con_northstar','org_demo_company','Liam Brooks','liam.brooks@northstar.example','+1-555-0201','Northstar Labs','{"instagram":"@northstarlabs"}','Interested in the enterprise workspace plan.'),
('con_greenfield','org_demo_company','Nora Williams','nora@greenfield.example','+1-555-0202','Greenfield Health','{}','Requested a security and compliance overview.')
on conflict (id) do update set name=excluded.name;
insert into public.deals (id,organization_id,title,contact_id,value,currency,stage,assigned_to) values
('deal_acme_expansion','org_demo_company','Acme workspace expansion','con_acme',48000,'USD','Proposal',(select id from public.profiles where email='esraa@democompany.com')),
('deal_northstar_trial','org_demo_company','Northstar enterprise trial','con_northstar',24000,'USD','Contacted',(select id from public.profiles where email='john.doe@democompany.com')),
('deal_greenfield_renewal','org_demo_company','Greenfield annual renewal','con_greenfield',72000,'USD','Won',(select id from public.profiles where email='abdallah@democompany.com'))
on conflict (id) do update set stage=excluded.stage, value=excluded.value;

insert into public.canvases (id,organization_id,title,content,channel_id,creator_id) values
('cnv_quarterly_plan','org_demo_company','Q3 Planning Notes','Goals\n- Improve onboarding\n- Reduce support response time\n- Launch enterprise reporting','chn_leadership',(select id from public.profiles where email='abdallah@democompany.com')),
('cnv_product_feedback','org_demo_company','Product Feedback Board','Customer themes: faster search, better mobile navigation, and flexible notifications.','chn_product',(select id from public.profiles where email='omar.hitman2010@gmail.com'))
on conflict (id) do update set content=excluded.content;

insert into public.agents (id,organization_id,name,username,email,model,job_details,personality,can_search_web,created_by) values
('agent_workspace_assistant','org_demo_company','DeskFlow Assistant','deskflow-assistant','assistant@democompany.com','deepseek-v4-pro','Help teammates find workspace information and complete operational tasks.','Helpful, concise, and transparent about uncertainty.',false,(select id from public.profiles where email='abdallah@democompany.com'))
on conflict (id) do update set job_details=excluded.job_details, personality=excluded.personality;

insert into public.saved_items (organization_id,user_id,message_id)
select 'org_demo_company', id, 'msg_product_launch' from public.profiles where email='abdallah@democompany.com'
on conflict (user_id,message_id) do nothing;

insert into public.system_audit_logs (id,organization_id,actor_id,action,details,ip_address,created_at) values
('log_workspace_created','org_demo_company',(select id from public.profiles where email='abdallah@democompany.com'),'workspace.created','Created the Demo Company workspace.','127.0.0.1','2026-08-01T08:45:00Z'),
('log_channel_created','org_demo_company',(select id from public.profiles where email='john.doe@democompany.com'),'channel.created','Created #product for product planning.','127.0.0.1','2026-08-02T10:20:00Z')
on conflict (id) do nothing;

commit;
