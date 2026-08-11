create extension if not exists "pgcrypto";

create table if not exists public.project_knowledge (
    id uuid primary key default gen_random_uuid(),

    category text not null,

    title text not null,

    content text not null,

    importance integer not null default 3
        check (importance between 1 and 5),

    tags text[] not null default '{}',

    source text,

    created_by text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

create index if not exists project_knowledge_category_idx
on public.project_knowledge(category);

create index if not exists project_knowledge_importance_idx
on public.project_knowledge(importance desc);

create index if not exists project_knowledge_tags_idx
on public.project_knowledge using gin(tags);


create table if not exists public.architectural_decisions (
    id uuid primary key default gen_random_uuid(),

    decision_key text not null unique,

    title text not null,

    context text not null,

    decision text not null,

    reason text,

    alternatives text[] not null default '{}',

    consequences text,

    status text not null default 'accepted'
        check (
            status in (
                'proposed',
                'accepted',
                'superseded',
                'deprecated'
            )
        ),

    supersedes uuid references public.architectural_decisions(id),

    created_by text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

create index if not exists architectural_decisions_status_idx
on public.architectural_decisions(status);

create index if not exists architectural_decisions_created_at_idx
on public.architectural_decisions(created_at desc);


create table if not exists public.agent_sessions (
    id uuid primary key default gen_random_uuid(),

    session_date timestamptz not null default now(),

    agent_name text,

    task text not null,

    summary text,

    files_changed text[] not null default '{}',

    decisions text[] not null default '{}',

    problems text[] not null default '{}',

    tests_run text[] not null default '{}',

    next_steps text[] not null default '{}',

    git_commit text,

    created_at timestamptz not null default now()
);

create index if not exists agent_sessions_date_idx
on public.agent_sessions(session_date desc);

create index if not exists agent_sessions_agent_idx
on public.agent_sessions(agent_name);


create or replace function public.update_agent_memory_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


drop trigger if exists project_knowledge_updated_at
on public.project_knowledge;

create trigger project_knowledge_updated_at
before update on public.project_knowledge
for each row
execute function public.update_agent_memory_updated_at();


drop trigger if exists architectural_decisions_updated_at
on public.architectural_decisions;

create trigger architectural_decisions_updated_at
before update on public.architectural_decisions
for each row
execute function public.update_agent_memory_updated_at();


alter table public.project_knowledge enable row level security;

alter table public.architectural_decisions enable row level security;

alter table public.agent_sessions enable row level security;