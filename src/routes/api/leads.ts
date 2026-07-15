import { json } from "@tanstack/react-start";
import { sql } from "~/db";
import { migrate } from "~/db/schema";

// Ensure schema exists on first API call
let migrated = false;
async function ensureMigrated() {
  if (!migrated) {
    await migrate();
    migrated = true;
  }
}

/**
 * GET /api/leads
 * List leads with pagination, filtering, and search.
 *
 * Query params: page, limit, business_type, status, search
 */
export async function GET({ request }: { request: Request }) {
  await ensureMigrated();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
  const business_type = url.searchParams.get("business_type") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const offset = (page - 1) * limit;

  const s = sql();

  // Build WHERE
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (business_type) {
    params.push(business_type);
    conditions.push("business_type = $" + params.length);
  }
  if (status) {
    params.push(status);
    conditions.push("status = $" + params.length);
  }
  if (search) {
    params.push("%" + search + "%");
    const p = params.length;
    conditions.push(
      "(company_name ilike $" + p + " or contact_name ilike $" + p + " or email ilike $" + p + ")",
    );
  }

  const whereClause = conditions.length > 0 ? "where " + conditions.join(" and ") : "";

  const countSQL = "select count(*)::int as total from leads " + whereClause;
  const leadsSQL = "select * from leads " + whereClause + " order by created_at desc limit $" + (params.length + 1) + " offset $" + (params.length + 2);
  const [countResult, rows] = await Promise.all([
    (s as any).query(countSQL, params),
    (s as (q: string, ...p: unknown[]) => Promise<Record<string, unknown>[]>)(leadsSQL, ...params, limit, offset),
  ]);

  const total = (countResult[0] as { total: number }).total;

  return json({
    leads: (rows as Record<string, unknown>[]).map(serializeLead),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * POST /api/leads
 * Generate leads for a business type.
 *
 * Body: { business_type: string, count?: number }
 */
export async function POST({ request }: { request: Request }) {
  await ensureMigrated();

  const body = (await request.json()) as { business_type?: string; count?: number };
  const business_type = body.business_type;

  if (!business_type || typeof business_type !== "string") {
    return json({ error: "business_type is required" }, { status: 400 });
  }

  const s = sql();
  const count = body.count ?? rand(5, 10);
  const mocks = mocksFor(business_type);

  // Ensure business_type exists
  await s`
    insert into business_types (name, description)
    values (${business_type}, ${`Auto-generated: ${business_type} leads`})
    on conflict (name) do nothing;
  `;

  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = i % mocks.companies.length;
    const contactName = mocks.contacts[idx];
    const company = mocks.companies[idx];
    const domain = mocks.domains[idx];
    const firstName =
      contactName.split(" ").slice(-2, -1)[0]?.toLowerCase() ||
      contactName.split(" ")[0].toLowerCase();

    const result = await s`
      insert into leads (business_type, company_name, contact_name, email, phone, website, source, status, score)
      values (
        ${business_type}, ${company}, ${contactName},
        ${`${firstName}@${domain}`}, ${mocks.phones[idx]},
        ${`https://www.${domain}`}, ${"generated"}, ${"new"},
        ${rand(20, 95)}
      )
      returning id
    `;
    ids.push((result[0] as { id: string }).id);
  }

  const rows = await s`select * from leads where id = any(${ids}) order by score desc`;
  return json({
    leads: (rows as Record<string, unknown>[]).map(serializeLead),
  });
}

// ── Helpers ───────────────────────────────────────────────────────

function serializeLead(row: Record<string, unknown>) {
  return {
    id: row.id,
    business_type: row.business_type,
    company_name: row.company_name,
    contact_name: row.contact_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    source: row.source,
    status: row.status,
    score: row.score,
    notes: row.notes ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mocksFor(businessType: string) {
  const catalog: Record<string, { companies: string[]; contacts: string[]; domains: string[]; phones: string[] }> = {
    "Real Estate": {
      companies: ["Summit Realty Group", "Coastal Properties Inc", "Heritage Homes Realty", "Pinnacle Real Estate", "Metro Property Partners", "Golden Gate Estates", "Blue Sky Realty", "Cornerstone Real Estate", "Elite Home Advisors", "Premier Living Realty"],
      contacts: ["Sarah Mitchell", "James Rodriguez", "Lisa Chen", "Michael Thompson", "Jennifer Park", "David Williams", "Amanda Brooks", "Robert Keller", "Michelle Davis", "Christopher Lee"],
      domains: ["summitrealty.com", "coastalprops.com", "heritagehomes.com", "pinnaclerealestate.com", "metroproperty.com", "goldengateestates.com", "blueskyrealty.com", "cornerstonere.com", "elitehomeadvisors.com", "premierliving.com"],
      phones: ["(555) 201-1000", "(555) 201-1001", "(555) 201-1002", "(555) 201-1003", "(555) 201-1004", "(555) 201-1005", "(555) 201-1006", "(555) 201-1007", "(555) 201-1008", "(555) 201-1009"],
    },
    "Dental": {
      companies: ["Bright Smile Dental", "ClearView Dental Care", "Gentle Touch Dentistry", "Premier Dental Associates", "Family First Dental", "Sunrise Dental Studio", "Oak Park Dental Group", "Modern Bite Dentistry", "Harmony Dental Clinic", "Evergreen Dental Arts"],
      contacts: ["Dr. Emily Foster", "Dr. Kevin Nguyen", "Dr. Rachel Green", "Dr. Steven Park", "Dr. Maria Santos", "Dr. Andrew Cole", "Dr. Jessica Hart", "Dr. Brian Wood", "Dr. Laura Kim", "Dr. Thomas Wright"],
      domains: ["brightsmiledental.com", "clearviewdental.com", "gentletouchdentistry.com", "premierdentalassoc.com", "familyfirstdental.com", "sunrisedentalstudio.com", "oakparkdental.com", "modernbitedds.com", "harmonydentalclinic.com", "evergreendentalarts.com"],
      phones: ["(555) 301-2000", "(555) 301-2001", "(555) 301-2002", "(555) 301-2003", "(555) 301-2004", "(555) 301-2005", "(555) 301-2006", "(555) 301-2007", "(555) 301-2008", "(555) 301-2009"],
    },
    "Legal": {
      companies: ["Meridian Law Group", "Crestview Legal Partners", "Atlas Law Firm", "Bridgewater Attorneys at Law", "Sterling Legal Associates", "NorthStar Law Offices", "Capitol Legal Group", "Harbor Law Collective", "Apex Litigation Firm", "Pacific Crest Legal"],
      contacts: ["Jonathan Blake, Esq.", "Catherine Moore, JD", "Richard Patel, Esq.", "Sandra Lewis, JD", "Mark Hendricks, Esq.", "Diana Russell, JD", "Patrick O'Brien, Esq.", "Victoria Chang, JD", "Frank Morrison, Esq.", "Natalie Reyes, JD"],
      domains: ["meridianlawgroup.com", "crestviewlegal.com", "atlaslawfirm.com", "bridgewaterattorneys.com", "sterlinglegal.com", "northstarlaw.com", "capitollegalgroup.com", "harborlawcollective.com", "apexlitigation.com", "pacificcrestlegal.com"],
      phones: ["(555) 401-3000", "(555) 401-3001", "(555) 401-3002", "(555) 401-3003", "(555) 401-3004", "(555) 401-3005", "(555) 401-3006", "(555) 401-3007", "(555) 401-3008", "(555) 401-3009"],
    },
    "Plumbing": {
      companies: ["FlowRight Plumbing", "Apex Pipe Services", "Green Valley Plumbing", "RapidRooter Plumbing", "Heritage Plumbing Co", "BlueStream Plumbing", "Precision Pipe Works", "Hometown Plumbers", "Capitol Plumbing Solutions", "EverFlow Plumbing & Drain"],
      contacts: ["Mike Turner", "Jose Ramirez", "Dave Kowalski", "Tom Henderson", "Chris Baldwin", "Luis Fernandez", "Ron Wheeler", "Gary Simmons", "Steve Crawford", "Dan O'Malley"],
      domains: ["flowrightplumbing.com", "apexpipeservices.com", "greenvalleyplumbing.com", "rapidrooter.com", "heritageplumbingco.com", "bluestreamplumbing.com", "precisionpipeworks.com", "hometownplumbers.com", "capitolplumbingsolutions.com", "everflowplumbing.com"],
      phones: ["(555) 501-4000", "(555) 501-4001", "(555) 501-4002", "(555) 501-4003", "(555) 501-4004", "(555) 501-4005", "(555) 501-4006", "(555) 501-4007", "(555) 501-4008", "(555) 501-4009"],
    },
  };

  const entry = catalog[businessType];
  if (entry) return entry;

  // Generic fallback
  const slug = businessType.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return {
    companies: Array.from({ length: 10 }, (_, i) => `${businessType} ${["Pro", "Hub", "Works", "Lab", "Genius", "Now", "X", "Plus", "HQ", "Direct"][i]}`),
    contacts: Array.from({ length: 10 }, () => ["Alex Morgan", "Jordan Taylor", "Casey Rivera", "Morgan Lee", "Taylor Brooks", "Riley Cooper", "Avery Quinn", "Cameron Hayes", "Dakota Reed", "Finley Shaw"][rand(0, 9)]),
    domains: Array.from({ length: 10 }, (_, i) => `${slug}${i > 0 ? i + 1 : ""}.com`),
    phones: Array.from({ length: 10 }, () => `(555) ${rand(600, 999)}-${String(rand(0, 9999)).padStart(4, "0")}`),
  };
}
