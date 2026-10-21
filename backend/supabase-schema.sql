-- Supabase PostgreSQL Schema untuk Website Chat Room
-- Jalankan query ini di Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username varchar(30) not null unique,
  display_name varchar(80) not null,
  email varchar(255) not null unique,
  password_hash text not null,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_username_no_spaces check (username !~ '\s'),
  constraint users_username_not_blank check (length(trim(username)) > 0),
  constraint users_display_name_not_blank check (length(trim(display_name)) > 0)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  contact_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint contacts_not_self check (owner_id <> contact_user_id),
  constraint contacts_owner_contact_unique unique (owner_id, contact_user_id)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role varchar(10) not null default 'member',
  joined_at timestamptz not null default now(),
  constraint group_members_role_check check (role in ('admin', 'member')),
  constraint group_members_unique unique (group_id, user_id)
);

create table if not exists public.invite_links (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  code varchar(100) not null unique,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  expires_at timestamptz null,
  constraint invite_links_code_not_blank check (length(trim(code)) > 0)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete restrict,
  content varchar(2000) not null,
  created_at timestamptz not null default now(),
  constraint messages_content_not_blank check (length(trim(content)) > 0)
);

create table if not exists public.mentions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  mentioned_user_id uuid not null references public.users(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint mentions_message_user_unique unique (message_id, mentioned_user_id)
);

create index if not exists idx_contacts_owner_id on public.contacts(owner_id);
create index if not exists idx_contacts_contact_user_id on public.contacts(contact_user_id);
create index if not exists idx_groups_created_by on public.groups(created_by);
create index if not exists idx_group_members_user_id on public.group_members(user_id);
create index if not exists idx_group_members_group_id on public.group_members(group_id);
create index if not exists idx_invite_links_group_id on public.invite_links(group_id);
create index if not exists idx_messages_group_created on public.messages(group_id, created_at);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_mentions_user_read on public.mentions(mentioned_user_id, is_read);
create index if not exists idx_mentions_message_id on public.mentions(message_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();
