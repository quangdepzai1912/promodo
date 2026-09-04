create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  completed boolean not null default false,
  pomodoros integer not null default 1 check (pomodoros > 0),
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pomodoro integer not null default 25 check (pomodoro between 1 and 60),
  short_break integer not null default 5 check (short_break between 1 and 60),
  long_break integer not null default 15 check (long_break between 1 and 60),
  auto_start_breaks boolean not null default false,
  auto_start_pomodoros boolean not null default false,
  volume integer not null default 80 check (volume between 0 and 100),
  alarm_sound text not null default 'bell',
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can manage their own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index tasks_user_id_created_at_idx on public.tasks(user_id, created_at);