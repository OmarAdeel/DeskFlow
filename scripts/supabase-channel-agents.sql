begin;

-- AI agents are not profiles, so they cannot be stored in channel_members.user_id.
-- Keep their channel membership in its own normalized table.
create table if not exists public.channel_agents (
  channel_id text not null references public.channels(id) on delete cascade,
  agent_id text not null references public.agents(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, agent_id)
);

create index if not exists channel_agents_agent_idx
  on public.channel_agents(agent_id);

alter table public.channel_agents enable row level security;

drop policy if exists channel_agents_select on public.channel_agents;
drop policy if exists channel_agents_admin_write on public.channel_agents;

create policy channel_agents_select
on public.channel_agents
for select to authenticated
using (private.can_access_channel(channel_id));

create policy channel_agents_admin_write
on public.channel_agents
for all to authenticated
using (
  exists (
    select 1
    from public.channels c
    where c.id = channel_id
      and private.is_organization_admin(c.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.channels c
    where c.id = channel_id
      and private.is_organization_admin(c.organization_id)
  )
);

commit;
