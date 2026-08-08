begin;

-- AI agents are stored in public.agents (text ids), while public.messages.sender_id
-- is intentionally a profile UUID. Keep agent messages in a separate table so the
-- human-message foreign key and RLS rules remain intact.
create table if not exists public.agent_messages (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  channel_id text not null references public.channels(id) on delete cascade,
  agent_id text not null references public.agents(id) on delete cascade,
  -- This is deliberately not a foreign key: a thread can be rooted at either a
  -- human message or another agent message.
  parent_message_id text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_messages_channel_created_idx
  on public.agent_messages(channel_id, created_at);
create index if not exists agent_messages_parent_idx
  on public.agent_messages(parent_message_id);

alter table public.agent_messages enable row level security;

drop policy if exists agent_messages_select on public.agent_messages;
create policy agent_messages_select
on public.agent_messages
for select to authenticated
using (
  private.is_organization_member(organization_id)
  and private.can_access_channel(channel_id)
);

-- The API route uses the service role after validating the caller, channel, and
-- agent. No direct client insert policy is granted for agent-authored messages.
drop policy if exists agent_messages_admin_delete on public.agent_messages;
create policy agent_messages_admin_delete
on public.agent_messages
for delete to authenticated
using (private.is_organization_admin(organization_id));

grant select, delete on public.agent_messages to authenticated;

-- Realtime is required for other open browser sessions to receive an agent reply
-- without a refresh. This is idempotent for Supabase projects.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'agent_messages'
  ) then
    alter publication supabase_realtime add table public.agent_messages;
  end if;
end $$;

commit;
