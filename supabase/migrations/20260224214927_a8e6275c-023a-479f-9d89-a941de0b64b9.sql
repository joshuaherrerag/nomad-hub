
-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  title text,
  bio text,
  location_city text,
  location_country text,
  availability text default 'open'
    check (availability in ('open','freelance','unavailable')),
  interests text[] default '{}',
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Profiles visibles" on public.profiles for select using (true);
create policy "Usuario edita su perfil" on public.profiles for update using (auth.uid() = id);
create policy "Usuario inserta su perfil" on public.profiles for insert with check (auth.uid() = id);

-- Skills
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);
alter table public.skills enable row level security;
create policy "Skills visibles" on public.skills for select using (true);

-- Profile skills junction
create table public.profile_skills (
  profile_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  primary key (profile_id, skill_id)
);
alter table public.profile_skills enable row level security;
create policy "Profile skills visibles" on public.profile_skills for select using (true);
create policy "Usuario gestiona sus skills" on public.profile_skills for insert with check (auth.uid() = profile_id);
create policy "Usuario elimina sus skills" on public.profile_skills for delete using (auth.uid() = profile_id);

-- Jobs
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company_name text not null,
  company_logo_url text,
  description text,
  category text,
  seniority text check (seniority in ('junior','mid','senior','lead')),
  contract_type text check (contract_type in ('fulltime','parttime','contract','freelance')),
  salary_min integer,
  salary_max integer,
  currency text default 'USD',
  source text default 'nestify',
  source_url text unique,
  is_featured boolean default false,
  published_at timestamptz default now()
);
alter table public.jobs enable row level security;
create policy "Jobs visibles" on public.jobs for select using (true);

-- Saved jobs
create table public.saved_jobs (
  profile_id uuid references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  primary key (profile_id, job_id)
);
alter table public.saved_jobs enable row level security;
create policy "Ver saved jobs propios" on public.saved_jobs for select using (auth.uid() = profile_id);
create policy "Guardar jobs" on public.saved_jobs for insert with check (auth.uid() = profile_id);
create policy "Eliminar saved jobs" on public.saved_jobs for delete using (auth.uid() = profile_id);

-- Benefits
create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  partner_name text not null,
  partner_logo_url text,
  title text not null,
  description text,
  value_label text,
  category text check (category in ('tech','travel','finance','health','education')),
  redeem_type text check (redeem_type in ('code','link','email')),
  redeem_value text,
  redeem_instructions text,
  is_featured boolean default false,
  valid_until timestamptz,
  created_at timestamptz default now()
);
alter table public.benefits enable row level security;
create policy "Benefits visibles" on public.benefits for select using (true);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
