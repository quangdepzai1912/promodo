create table if not exists public.study_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  minutes integer not null default 0 check (minutes >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, study_date)
);

alter table public.study_logs enable row level security;

drop policy if exists "Users can manage their own study logs" on public.study_logs;
create policy "Users can manage their own study logs"
  on public.study_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists study_logs_user_date_idx on public.study_logs(user_id, study_date);