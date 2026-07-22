create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null check (char_length(trim(front)) > 0),
  back text not null check (char_length(trim(back)) > 0),
  front_type text not null check (front_type in ('text', 'code')),
  back_type text not null check (back_type in ('text', 'code')),
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  repetitions integer not null default 0 check (repetitions >= 0),
  interval_days integer not null default 0 check (interval_days >= 0),
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor between 1.30 and 3.20),
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.card_attachments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null unique references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create table if not exists public.local_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_key text not null default 'mindre-cache' check (char_length(trim(source_key)) > 0),
  fingerprint text not null check (char_length(fingerprint) between 16 and 128),
  deck_count integer not null default 0 check (deck_count >= 0),
  card_count integer not null default 0 check (card_count >= 0),
  imported_at timestamptz not null default now(),
  unique (user_id, fingerprint)
);

create index if not exists decks_user_id_idx on public.decks(user_id);
create index if not exists cards_user_id_idx on public.cards(user_id);
create index if not exists cards_deck_id_idx on public.cards(deck_id);
create index if not exists card_progress_card_id_idx on public.card_progress(card_id);
create index if not exists card_progress_due_idx on public.card_progress(user_id, due_at);
create index if not exists card_attachments_user_id_idx on public.card_attachments(user_id);
create index if not exists local_imports_user_id_idx on public.local_imports(user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, avatar_url)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', split_part(email, '@', 1)),
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
from auth.users
on conflict (id) do nothing;

create or replace function public.enforce_card_owner()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  deck_owner uuid;
begin
  select user_id into deck_owner from public.decks where id = new.deck_id;
  if deck_owner is null or deck_owner <> new.user_id then
    raise exception 'card user_id must match the deck owner';
  end if;
  return new;
end;
$$;

drop trigger if exists cards_enforce_owner on public.cards;
create trigger cards_enforce_owner
before insert or update of deck_id, user_id on public.cards
for each row execute function public.enforce_card_owner();

create or replace function public.enforce_progress_owner()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  card_owner uuid;
begin
  select user_id into card_owner from public.cards where id = new.card_id;
  if card_owner is null or card_owner <> new.user_id then
    raise exception 'progress user_id must match the card owner';
  end if;
  return new;
end;
$$;

drop trigger if exists card_progress_enforce_owner on public.card_progress;
create trigger card_progress_enforce_owner
before insert or update of card_id, user_id on public.card_progress
for each row execute function public.enforce_progress_owner();

create or replace function public.enforce_attachment_owner()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  card_owner uuid;
  card_deck uuid;
begin
  select user_id, deck_id into card_owner, card_deck from public.cards where id = new.card_id;
  if card_owner is null or card_owner <> new.user_id then
    raise exception 'attachment user_id must match the card owner';
  end if;
  if split_part(new.storage_path, '/', 1) <> new.user_id::text
    or split_part(new.storage_path, '/', 2) <> card_deck::text then
    raise exception 'attachment storage path must use the owning user and deck folders';
  end if;
  return new;
end;
$$;

drop trigger if exists card_attachments_enforce_owner on public.card_attachments;
create trigger card_attachments_enforce_owner
before insert or update of card_id, user_id, storage_path on public.card_attachments
for each row execute function public.enforce_attachment_owner();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists decks_set_updated_at on public.decks;
create trigger decks_set_updated_at before update on public.decks
for each row execute function public.set_updated_at();

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at before update on public.cards
for each row execute function public.set_updated_at();

drop trigger if exists card_progress_set_updated_at on public.card_progress;
create trigger card_progress_set_updated_at before update on public.card_progress
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.card_progress enable row level security;
alter table public.card_attachments enable row level security;
alter table public.local_imports enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

create policy "decks_select_own" on public.decks for select to authenticated
using ((select auth.uid()) = user_id);
create policy "decks_insert_own" on public.decks for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "decks_update_own" on public.decks for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "decks_delete_own" on public.decks for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "cards_select_own" on public.cards for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.decks d where d.id = deck_id and d.user_id = (select auth.uid()))
);
create policy "cards_insert_own_deck" on public.cards for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.decks d where d.id = deck_id and d.user_id = (select auth.uid()))
);
create policy "cards_update_own" on public.cards for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.decks d where d.id = deck_id and d.user_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.decks d where d.id = deck_id and d.user_id = (select auth.uid()))
);
create policy "cards_delete_own" on public.cards for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.decks d where d.id = deck_id and d.user_id = (select auth.uid()))
);

create policy "progress_select_own" on public.card_progress for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.cards c where c.id = card_id and c.user_id = (select auth.uid()))
);
create policy "progress_insert_own" on public.card_progress for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.cards c where c.id = card_id and c.user_id = (select auth.uid()))
);
create policy "progress_update_own" on public.card_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.cards c where c.id = card_id and c.user_id = (select auth.uid()))
);
create policy "progress_delete_own" on public.card_progress for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "attachments_select_own" on public.card_attachments for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.cards c where c.id = card_id and c.user_id = (select auth.uid()))
);
create policy "attachments_insert_own" on public.card_attachments for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.cards c where c.id = card_id and c.user_id = (select auth.uid()))
);
create policy "attachments_update_own" on public.card_attachments for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.cards c where c.id = card_id and c.user_id = (select auth.uid()))
);
create policy "attachments_delete_own" on public.card_attachments for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "local_imports_select_own" on public.local_imports for select to authenticated
using ((select auth.uid()) = user_id);
create policy "local_imports_insert_own" on public.local_imports for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "local_imports_update_own" on public.local_imports for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "local_imports_delete_own" on public.local_imports for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.import_local_flashcards(payload jsonb, import_fingerprint text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  import_id uuid;
  deck_json jsonb;
  card_json jsonb;
  new_deck_id uuid;
  deck_created_at timestamptz;
  card_created_at timestamptz;
  imported_decks integer := 0;
  imported_cards integer := 0;
  front_kind text;
  back_kind text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if jsonb_typeof(payload -> 'decks') <> 'array' then raise exception 'invalid local Mindre payload'; end if;
  if import_fingerprint is null or char_length(import_fingerprint) < 16 then raise exception 'invalid import fingerprint'; end if;

  insert into public.local_imports (user_id, fingerprint)
  values (auth.uid(), import_fingerprint)
  on conflict (user_id, fingerprint) do nothing
  returning id into import_id;

  if import_id is null then
    select deck_count, card_count into imported_decks, imported_cards
    from public.local_imports where user_id = auth.uid() and fingerprint = import_fingerprint;
    return jsonb_build_object('duplicate', true, 'deck_count', imported_decks, 'card_count', imported_cards);
  end if;

  for deck_json in select value from jsonb_array_elements(payload -> 'decks') loop
    if nullif(trim(deck_json ->> 'name'), '') is null then raise exception 'local deck name is required'; end if;
    deck_created_at := case
      when coalesce(deck_json ->> 'createdAt', '') ~ '^[0-9]+$'
        then to_timestamp((deck_json ->> 'createdAt')::double precision / 1000.0)
      else now()
    end;

    insert into public.decks (user_id, name, created_at, updated_at)
    values (auth.uid(), left(trim(deck_json ->> 'name'), 60), deck_created_at, deck_created_at)
    returning id into new_deck_id;
    imported_decks := imported_decks + 1;

    if jsonb_typeof(deck_json -> 'cards') = 'array' then
      for card_json in select value from jsonb_array_elements(deck_json -> 'cards') loop
        if nullif(trim(card_json ->> 'front'), '') is null or nullif(trim(card_json ->> 'back'), '') is null then
          raise exception 'local cards must contain front and back text';
        end if;
        front_kind := case when card_json ->> 'frontType' = 'code' then 'code' else 'text' end;
        back_kind := case when card_json ->> 'backType' = 'code' then 'code' else 'text' end;
        card_created_at := case
          when coalesce(card_json ->> 'createdAt', '') ~ '^[0-9]+$'
            then to_timestamp((card_json ->> 'createdAt')::double precision / 1000.0)
          else deck_created_at
        end;

        insert into public.cards (
          deck_id, user_id, front, back, front_type, back_type, language, created_at, updated_at
        ) values (
          new_deck_id,
          auth.uid(),
          card_json ->> 'front',
          card_json ->> 'back',
          front_kind,
          back_kind,
          nullif(card_json ->> 'language', ''),
          card_created_at,
          card_created_at
        );
        imported_cards := imported_cards + 1;
      end loop;
    end if;
  end loop;

  update public.local_imports
  set deck_count = imported_decks, card_count = imported_cards
  where id = import_id;

  return jsonb_build_object('duplicate', false, 'deck_count', imported_decks, 'card_count', imported_cards);
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('mindre-files', 'mindre-files', false, 10485760)
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit;

create policy "mindre_files_select_own" on storage.objects for select to authenticated
using (
  bucket_id = 'mindre-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "mindre_files_insert_own" on storage.objects for insert to authenticated
with check (
  bucket_id = 'mindre-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "mindre_files_update_own" on storage.objects for update to authenticated
using (
  bucket_id = 'mindre-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'mindre-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "mindre_files_delete_own" on storage.objects for delete to authenticated
using (
  bucket_id = 'mindre-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

revoke all on public.profiles, public.decks, public.cards, public.card_progress,
  public.card_attachments, public.local_imports from anon;
revoke all on function public.import_local_flashcards(jsonb, text) from public;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.decks, public.cards,
  public.card_progress, public.card_attachments, public.local_imports to authenticated;
grant execute on function public.import_local_flashcards(jsonb, text) to authenticated;
