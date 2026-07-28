import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Types ─────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  business_type: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadsQuery {
  page?: number;
  limit?: number;
  business_type?: string;
  status?: string;
  search?: string;
}

export interface LeadsResult {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Mock data generators by business type ────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface MockTemplates {
  companies: string[];
  contacts: string[];
  domains: string[];
  phones: string[];
}

const MOCK_DATA: Record<string, MockTemplates> = {
  "Real Estate": {
    companies: [
      "Summit Realty Group", "Coastal Properties Inc", "Heritage Homes Realty",
      "Pinnacle Real Estate", "Metro Property Partners", "Golden Gate Estates",
      "Blue Sky Realty", "Cornerstone Real Estate", "Elite Home Advisors",
      "Premier Living Realty",
    ],
    contacts: [
      "Sarah Mitchell", "James Rodriguez", "Lisa Chen", "Michael Thompson",
      "Jennifer Park", "David Williams", "Amanda Brooks", "Robert Keller",
      "Michelle Davis", "Christopher Lee",
    ],
    domains: [
      "summitrealty.com", "coastalprops.com", "heritagehomes.com",
      "pinnaclerealestate.com", "metroproperty.com", "goldengateestates.com",
      "blueskyrealty.com", "cornerstonere.com", "elitehomeadvisors.com",
      "premierliving.com",
    ],
    phones: [
      "(555) 201-1000", "(555) 201-1001", "(555) 201-1002",
      "(555) 201-1003", "(555) 201-1004", "(555) 201-1005",
      "(555) 201-1006", "(555) 201-1007", "(555) 201-1008",
      "(555) 201-1009",
    ],
  },
  "Dental": {
    companies: [
      "Bright Smile Dental", "ClearView Dental Care", "Gentle Touch Dentistry",
      "Premier Dental Associates", "Family First Dental", "Sunrise Dental Studio",
      "Oak Park Dental Group", "Modern Bite Dentistry", "Harmony Dental Clinic",
      "Evergreen Dental Arts",
    ],
    contacts: [
      "Dr. Emily Foster", "Dr. Kevin Nguyen", "Dr. Rachel Green",
      "Dr. Steven Park", "Dr. Maria Santos", "Dr. Andrew Cole",
      "Dr. Jessica Hart", "Dr. Brian Wood", "Dr. Laura Kim",
      "Dr. Thomas Wright",
    ],
    domains: [
      "brightsmiledental.com", "clearviewdental.com", "gentletouchdentistry.com",
      "premierdentalassoc.com", "familyfirstdental.com", "sunrisedentalstudio.com",
      "oakparkdental.com", "modernbitedds.com", "harmonydentalclinic.com",
      "evergreendentalarts.com",
    ],
    phones: [
      "(555) 301-2000", "(555) 301-2001", "(555) 301-2002",
      "(555) 301-2003", "(555) 301-2004", "(555) 301-2005",
      "(555) 301-2006", "(555) 301-2007", "(555) 301-2008",
      "(555) 301-2009",
    ],
  },
  "Legal": {
    companies: [
      "Meridian Law Group", "Crestview Legal Partners", "Atlas Law Firm",
      "Bridgewater Attorneys at Law", "Sterling Legal Associates",
      "NorthStar Law Offices", "Capitol Legal Group", "Harbor Law Collective",
      "Apex Litigation Firm", "Pacific Crest Legal",
    ],
    contacts: [
      "Jonathan Blake, Esq.", "Catherine Moore, JD", "Richard Patel, Esq.",
      "Sandra Lewis, JD", "Mark Hendricks, Esq.", "Diana Russell, JD",
      "Patrick O'Brien, Esq.", "Victoria Chang, JD", "Frank Morrison, Esq.",
      "Natalie Reyes, JD",
    ],
    domains: [
      "meridianlawgroup.com", "crestviewlegal.com", "atlaslawfirm.com",
      "bridgewaterattorneys.com", "sterlinglegal.com", "northstarlaw.com",
      "capitollegalgroup.com", "harborlawcollective.com", "apexlitigation.com",
      "pacificcrestlegal.com",
    ],
    phones: [
      "(555) 401-3000", "(555) 401-3001", "(555) 401-3002",
      "(555) 401-3003", "(555) 401-3004", "(555) 401-3005",
      "(555) 401-3006", "(555) 401-3007", "(555) 401-3008",
      "(555) 401-3009",
    ],
  },
  "Plumbing": {
    companies: [
      "FlowRight Plumbing", "Apex Pipe Services", "Green Valley Plumbing",
      "RapidRooter Plumbing", "Heritage Plumbing Co", "BlueStream Plumbing",
      "Precision Pipe Works", "Hometown Plumbers", "Capitol Plumbing Solutions",
      "EverFlow Plumbing & Drain",
    ],
    contacts: [
      "Mike Turner", "Jose Ramirez", "Dave Kowalski", "Tom Henderson",
      "Chris Baldwin", "Luis Fernandez", "Ron Wheeler", "Gary Simmons",
      "Steve Crawford", "Dan O'Malley",
    ],
    domains: [
      "flowrightplumbing.com", "apexpipeservices.com", "greenvalleyplumbing.com",
      "rapidrooter.com", "heritageplumbingco.com", "bluestreamplumbing.com",
      "precisionpipeworks.com", "hometownplumbers.com", "capitolplumbingsolutions.com",
      "everflowplumbing.com",
    ],
    phones: [
      "(555) 501-4000", "(555) 501-4001", "(555) 501-4002",
      "(555) 501-4003", "(555) 501-4004", "(555) 501-4005",
      "(555) 501-4006", "(555) 501-4007", "(555) 501-4008",
      "(555) 501-4009",
    ],
  },
};

// Fallback for any business type without explicit mock data
function genericMocks(businessType: string): MockTemplates {
  const slug = businessType.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return {
    companies: Array.from({ length: 10 }, (_, i) =>
      `${businessType.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} ${["Pro", "Hub", "Works", "Lab", "Genius", "Now", "X", "Plus", "HQ", "Direct"][i]}`,
    ),
    contacts: Array.from({ length: 10 }, (_, i) =>
      pick(["Alex Morgan", "Jordan Taylor", "Casey Rivera", "Morgan Lee", "Taylor Brooks", "Riley Cooper", "Avery Quinn", "Cameron Hayes", "Dakota Reed", "Finley Shaw"]),
    ),
    domains: Array.from({ length: 10 }, (_, i) => `${slug}${i > 0 ? i + 1 : ""}.com`),
    phones: Array.from({ length: 10 }, (_, i) => `(555) ${rand(600, 999)}-${String(rand(0, 9999)).padStart(4, "0")}`),
  };
}

function mocksFor(businessType: string): MockTemplates {
  return MOCK_DATA[businessType] ?? genericMocks(businessType);
}

// ── Server Functions ──────────────────────────────────────────────

/**
 * Generate mock leads for a given business type.
 * Creates 5-10 leads with random scores and returns them.
 */
export const generateLeads = createServerFn({ method: "POST" })
  .validator((data: { business_type: string; count?: number }) => {
    if (!data.business_type || typeof data.business_type !== "string") {
      throw new Error("business_type is required");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const s = sql();
    const mocks = mocksFor(data.business_type);
    const count = data.count ?? rand(5, 10);
    const leads: Omit<Lead, "created_at" | "updated_at">[] = [];

    // Ensure business_type exists in business_types table
    await s`
      insert into business_types (name, description)
      values (${data.business_type}, ${`Auto-generated: ${data.business_type} leads`})
      on conflict (name) do nothing;
    `;

    for (let i = 0; i < count; i++) {
      const idx = i % mocks.companies.length;
      const contactName = mocks.contacts[idx];
      const company = mocks.companies[idx];
      const domain = mocks.domains[idx];
      const firstName = contactName.split(" ").slice(-2, -1)[0]?.toLowerCase() || contactName.split(" ")[0].toLowerCase();

      const lead = {
        business_type: data.business_type,
        company_name: company,
        contact_name: contactName,
        email: `${firstName}@${domain}`,
        phone: mocks.phones[idx],
        website: `https://www.${domain}`,
        source: "generated",
        status: "new" as const,
        score: rand(20, 95),
        notes: null,
      };

      const result = await s`
        insert into leads ${s(lead as Record<string, unknown>)}
        returning id, created_at, updated_at
      `;
      const row = result[0] as { id: string; created_at: string; updated_at: string };
      leads.push({ ...lead, id: row.id } as Lead);
    }

    // Fetch full leads to return proper timestamps
    const ids = leads.map((l) => l.id);
    if (ids.length === 0) return { leads: [] };

    const rows = await s`select * from leads where id = any(${ids}) order by score desc`;
    return {
      leads: (rows as Record<string, unknown>[]).map(serializeLead),
    };
  });

/**
 * List leads with pagination, filtering, and search.
 */
export const listLeads = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: LeadsQuery }) => {
    const s = sql();
    const page = data.page ?? 1;
    const limit = Math.min(data.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (data.business_type) {
      params.push(data.business_type);
      conditions.push("business_type = $" + params.length);
    }
    if (data.status) {
      params.push(data.status);
      conditions.push("status = $" + params.length);
    }
    if (data.search) {
      params.push("%" + data.search + "%");
      const p = params.length;
      conditions.push(
        "(company_name ilike $" + p + " or contact_name ilike $" + p + " or email ilike $" + p + ")",
      );
    }

    const whereClause = conditions.length > 0 ? "where " + conditions.join(" and ") : "";

    // Count and query — Neon-compatible parameterized queries
    const countSQL = "select count(*)::int as total from leads " + whereClause;
    const leadsSQL = "select * from leads " + whereClause + " order by created_at desc limit $" + (params.length + 1) + " offset $" + (params.length + 2);

    const [countResult, rows] = await Promise.all([
      (s as any).query(countSQL, params),
      (s as (q: string, ...p: unknown[]) => Promise<Record<string, unknown>[]>)(leadsSQL, ...params, limit, offset),
    ]);
    const total = (countResult[0] as { total: number }).total;

    return {
      leads: (rows as Record<string, unknown>[]).map(serializeLead),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    } satisfies LeadsResult;
  });

/**
 * Get a single lead by ID.
 */
export const getLead = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const s = sql();
    const rows = await s`select * from leads where id = ${data.id}`;
    if (rows.length === 0) return null;
    return serializeLead(rows[0] as Record<string, unknown>);
  });

/**
 * Update a lead (status, notes, score, etc.).
 */
export const updateLead = createServerFn({ method: "PATCH" })
  .validator(
    (data: {
      id: string;
      status?: Lead["status"];
      notes?: string;
      score?: number;
      contact_name?: string;
      email?: string;
      phone?: string;
    }) => {
      if (!data.id) throw new Error("id is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const s = sql();
    const { id, ...fields } = data;

    if (Object.keys(fields).length === 0) {
      throw new Error("At least one field to update is required");
    }

    // Build SET clause dynamically
    const setClauses: string[] = [];
    const setParams: unknown[] = [id];
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        setParams.push(value);
        setClauses.push(key + " = $" + setParams.length);
      }
    }
    setClauses.push("updated_at = now()");

    const updateSQL = "update leads set " + setClauses.join(", ") + " where id = $1 returning *";
    const rows = await (s as any).query(updateSQL, setParams);

    if (rows.length === 0) return null;
    return serializeLead(rows[0] as Record<string, unknown>);
  });

/**
 * Delete a lead by ID.
 */
export const deleteLead = createServerFn({ method: "DELETE" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const s = sql();
    const rows = await s`delete from leads where id = ${data.id} returning id`;
    return { deleted: rows.length > 0 };
  });

// ── Helpers ───────────────────────────────────────────────────────

function serializeLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    business_type: row.business_type as string,
    company_name: row.company_name as string,
    contact_name: (row.contact_name as string) ?? null,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    website: (row.website as string) ?? null,
    source: row.source as string,
    status: row.status as Lead["status"],
    score: row.score as number,
    notes: (row.notes as string) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}
