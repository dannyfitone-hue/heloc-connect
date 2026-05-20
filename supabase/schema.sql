create extension if not exists "pgcrypto";

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  tracking_id text unique not null,
  client_token text unique not null,
  first_name text,
  last_name text,
  phone text,
  email text,
  property_address text,
  home_value numeric default 0,
  credit_score text,
  monthly_income numeric default 0,
  requested_cash numeric default 0,
  loan_purpose text,
  lead_source text,
  status text default 'Application Received',
  funded_amount numeric default 0,
  assigned_lender text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lead_documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  document_type text not null,
  note text,
  status text default 'Requested',
  file_path text,
  file_name text,
  created_at timestamptz default now(),
  uploaded_at timestamptz
);

create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  note text not null,
  created_at timestamptz default now()
);

alter table leads enable row level security;
alter table lead_documents enable row level security;
alter table lead_notes enable row level security;
-- API routes use service role key server-side for MVP.
-- Create Supabase Storage bucket: client-documents
