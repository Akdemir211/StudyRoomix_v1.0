-- Drop existing objects if they exist
drop trigger if exists on_room_create on public.watch_rooms;
drop function if exists public.initialize_video_state();
drop table if exists public.video_states;

-- Create video_states table
create table if not exists public.video_states (
  room_id uuid references public.watch_rooms(id) on delete cascade,
  is_playing boolean default false,
  playback_time double precision default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (room_id)
);

-- Add RLS policies
alter table public.video_states enable row level security;

create policy "video_states_select_policy"
  on public.video_states
  for select
  to authenticated
  using (true);

create policy "video_states_update_policy"
  on public.video_states
  for update
  to authenticated
  using (exists (
    select 1 from watch_rooms
    where id = video_states.room_id
    and created_by = auth.uid()
  ));

-- Function to initialize video state when room is created
create or replace function public.initialize_video_state()
returns trigger as $$
begin
  insert into public.video_states (room_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create video state when room is created
create trigger on_room_create
  after insert on public.watch_rooms
  for each row
  execute function public.initialize_video_state();