import { sql } from "~/db";

/**
 * Run database migrations — creates the LeadFlow schema if it doesn't exist.
 * Call once at app startup. Idempotent: safe to run multiple times.
 */
export async function migrate() {
  const s = sql();

  // ── business_types ──────────────────────────────────────────────
  await s`
    create table if not exists business_types (
      id          uuid primary key default gen_random_uuid(),
      name        text not null unique,
      description text,
      is_active   boolean not null default true
    );
  `;

  // ── leads ───────────────────────────────────────────────────────
  await s`
    create table if not exists leads (
      id                  uuid primary key default gen_random_uuid(),
      business_type       text not null,
      company_name        text not null,
      contact_name        text,
      job_title           text,
      email               text,
      phone               text,
      website             text,
      linkedin_url        text,
      company_description text,
      address             text,
      source              text not null default 'generated',
      source_detail       text,
      status              text not null default 'new'
                            check (status in ('new','contacted','qualified','converted','lost')),
      score               integer not null default 0,
      notes               text,
      context_notes       text,
      created_at          timestamptz not null default now(),
      updated_at          timestamptz not null default now()
    );
  `;

  // Add columns to existing tables (safe if columns already exist)
  for (const col of [
    "job_title text",
    "linkedin_url text",
    "company_description text",
    "address text",
    "source_detail text",
    "context_notes text",
  ]) {
    await (s as any).query("alter table leads add column if not exists " + col, []).catch(() => {});
  }

  // Index for fast lookups
  await s`create index if not exists idx_leads_business_type on leads(business_type);`;
  await s`create index if not exists idx_leads_status on leads(status);`;
  await s`create index if not exists idx_leads_score on leads(score desc);`;
  await s`create index if not exists idx_leads_created_at on leads(created_at);`;

  // ── Seed default business types (idempotent via ON CONFLICT) ──
  const defaults = [
    { name: "Real Estate", description: "Real estate agents, brokers, agencies" },
    { name: "Dental", description: "Dental practices and clinics" },
    { name: "Legal", description: "Law firms and attorneys" },
    { name: "Plumbing", description: "Plumbing contractors and services" },
    { name: "HVAC", description: "Heating, ventilation, and air conditioning" },
    { name: "Marketing Agency", description: "Digital marketing and creative agencies" },
    { name: "Software / SaaS", description: "Software and SaaS companies" },
    { name: "Restaurant", description: "Restaurants and food service" },
    { name: "Insurance", description: "Insurance agencies and brokers" },
    { name: "Medical Practice", description: "Medical clinics and physician practices" },
    { name: "Cleaning Service", description: "Commercial and residential cleaning" },
    { name: "Landscaping", description: "Landscaping and lawn care services" },
  ];

  for (const bt of defaults) {
    await s`
      insert into business_types (name, description)
      values (${bt.name}, ${bt.description})
      on conflict (name) do nothing;
    `;
  }

  return { ok: true };
}
