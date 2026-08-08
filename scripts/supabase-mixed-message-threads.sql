begin;

-- Human replies are stored in public.messages, while AI messages are stored in
-- public.agent_messages. A thread may be rooted in either table, so the former
-- foreign key to public.messages(id) rejects valid human replies to AI messages
-- with HTTP 409 / SQLSTATE 23503.
alter table public.messages
  drop constraint if exists messages_parent_message_id_fkey;

create index if not exists messages_parent_idx
  on public.messages(parent_message_id);

commit;
