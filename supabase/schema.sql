-- Little Us: ruang privat untuk maksimal dua pengguna.
-- Jalankan seluruh file ini di Supabase SQL Editor.
-- Jangan pernah menaruh service_role key di frontend.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.little_us_room (
  id uuid primary key,
  room_name text not null default 'Little Us',
  pin_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.little_us_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  room_id uuid not null references public.little_us_room(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 32),
  joined_at timestamptz not null default now(),
  unique(room_id,user_id)
);
create table if not exists public.love_signals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.little_us_room(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null default 'Us',
  kind text not null check (kind in ('kangen','peluk','daisy')),
  created_at timestamptz not null default now()
);
create table if not exists public.little_us_pin_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now()
);

insert into public.little_us_room(id,room_name,pin_hash)
values ('00000000-0000-0000-0000-000000002711','Little Us',extensions.crypt('271125',extensions.gen_salt('bf')))
on conflict (id) do nothing;

create or replace function public.is_little_us_member(p_room_id uuid)
returns boolean language sql stable security definer set search_path=public,auth
as $$ select exists(select 1 from public.little_us_members where user_id=auth.uid() and room_id=p_room_id); $$;
revoke all on function public.is_little_us_member(uuid) from public;
grant execute on function public.is_little_us_member(uuid) to authenticated;

create or replace function public.join_little_us_room(p_pin text)
returns jsonb language plpgsql security definer set search_path=public,extensions,auth
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.little_us_room%rowtype;
  v_member public.little_us_members%rowtype;
  v_attempt public.little_us_pin_attempts%rowtype;
  v_count integer;
  v_name text;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'message','auth_required'); end if;
  select * into v_room from public.little_us_room
    where id='00000000-0000-0000-0000-000000002711' for update;
  if not found then return jsonb_build_object('ok',false,'message','room_missing'); end if;

  select * into v_member from public.little_us_members where user_id=v_uid and room_id=v_room.id;
  if found then
    return jsonb_build_object('ok',true,'room_id',v_member.room_id,'member_id',v_member.user_id,'display_name',v_member.display_name);
  end if;

  select * into v_attempt from public.little_us_pin_attempts where user_id=v_uid for update;
  if found and now()-v_attempt.window_started_at < interval '15 minutes' and v_attempt.attempts >= 5 then
    return jsonb_build_object('ok',false,'message','too_many_attempts');
  end if;
  if not found then
    insert into public.little_us_pin_attempts(user_id,attempts,window_started_at) values(v_uid,1,now());
  elsif now()-v_attempt.window_started_at >= interval '15 minutes' then
    update public.little_us_pin_attempts set attempts=1,window_started_at=now() where user_id=v_uid;
  else
    update public.little_us_pin_attempts set attempts=attempts+1 where user_id=v_uid;
  end if;

  if p_pin is null or length(p_pin)<>6 or extensions.crypt(p_pin,v_room.pin_hash)<>v_room.pin_hash then
    return jsonb_build_object('ok',false,'message','wrong_pin');
  end if;
  select count(*) into v_count from public.little_us_members where room_id=v_room.id;
  if v_count>=2 then return jsonb_build_object('ok',false,'message','room_full'); end if;
  v_name := case when v_count=0 then 'User 1' else 'User 2' end;
  insert into public.little_us_members(user_id,room_id,display_name) values(v_uid,v_room.id,v_name) returning * into v_member;
  return jsonb_build_object('ok',true,'room_id',v_member.room_id,'member_id',v_member.user_id,'display_name',v_member.display_name);
end; $$;
revoke all on function public.join_little_us_room(text) from public;
grant execute on function public.join_little_us_room(text) to authenticated;

create or replace function public.set_love_signal_sender_name()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  select display_name into new.sender_name from public.little_us_members
  where user_id=new.sender_id and room_id=new.room_id;
  if new.sender_name is null then raise exception 'not_a_room_member'; end if;
  return new;
end; $$;
drop trigger if exists trg_love_signal_sender_name on public.love_signals;
create trigger trg_love_signal_sender_name before insert on public.love_signals
for each row execute function public.set_love_signal_sender_name();

alter table public.little_us_room enable row level security;
alter table public.little_us_members enable row level security;
alter table public.love_signals enable row level security;
alter table public.little_us_pin_attempts enable row level security;

drop policy if exists "members can view room members" on public.little_us_members;
drop policy if exists "room members read signals" on public.love_signals;
drop policy if exists "members send own signals" on public.love_signals;

create policy "members can view room members" on public.little_us_members
for select to authenticated using (public.is_little_us_member(room_id));
create policy "room members read signals" on public.love_signals
for select to authenticated using (public.is_little_us_member(room_id));
create policy "members send own signals" on public.love_signals
for insert to authenticated with check (sender_id=auth.uid() and public.is_little_us_member(room_id));

grant select on public.little_us_members to authenticated;
grant select,insert on public.love_signals to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.love_signals;
exception when duplicate_object then null;
when others then if sqlstate <> '42710' then raise; end if;
end $$;

-- Dashboard: Authentication > Sign In / Providers > Anonymous Sign-Ins: ON.
-- PIN 271125 adalah PIN bersama untuk prototipe privat. Batasi akses dan jangan membagikan URL/key secara tidak perlu.
