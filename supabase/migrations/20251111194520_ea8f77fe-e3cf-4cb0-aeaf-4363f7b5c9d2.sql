-- Create profile_analyses table
create table public.profile_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  profile_image text not null,
  input_data jsonb not null,
  analysis_result jsonb not null,
  platform text not null,
  is_favorite boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index idx_profile_analyses_user_id on public.profile_analyses(user_id);
create index idx_profile_analyses_created_at on public.profile_analyses(created_at desc);
create index idx_profile_analyses_platform on public.profile_analyses(platform);
create index idx_profile_analyses_favorite on public.profile_analyses(is_favorite) where is_favorite = true;

-- Enable RLS
alter table public.profile_analyses enable row level security;

-- RLS Policies
create policy "Users can view own analyses"
  on public.profile_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.profile_analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own analyses"
  on public.profile_analyses for update
  using (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.profile_analyses for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger update_profile_analyses_updated_at
  before update on public.profile_analyses
  for each row
  execute function public.handle_updated_at();