import type { Lead, DashboardStats } from "./mock-data";

export interface BusinessType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface LeadsResult {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byStatus: Record<string, number>;
  byBusinessType: Record<string, number>;
  averageScore: number;
}

// ── Mapping helpers ─────────────────────────────────────────────

function snakeToCamel(lead: Record<string, unknown>): Lead {
  return {
    id: lead.id as string,
    companyName: lead.company_name as string,
    contactName: lead.contact_name as string,
    email: lead.email as string,
    phone: lead.phone as string,
    businessType: lead.business_type as string,
    score: lead.score as number,
    status: lead.status as Lead["status"],
    notes: (lead.notes as string) || "",
    createdAt: lead.created_at as string,
    source: (lead.source as string) || "",
    website: (lead.website as string) || "",
    address: "",
  };
}

function mapStats(api: ApiStats): DashboardStats {
  const converted = api.byStatus["converted"] ?? 0;
  const total = api.total || 1;
  return {
    totalLeads: api.total,
    leadsToday: api.today,
    leadsThisWeek: api.thisWeek,
    conversionRate: Math.round((converted / total) * 100),
    newLeads: api.byStatus["new"] ?? 0,
    contactedLeads: api.byStatus["contacted"] ?? 0,
    qualifiedLeads: api.byStatus["qualified"] ?? 0,
  };
}

// ── API client ──────────────────────────────────────────────────

const BASE = ""; // Same-origin

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export async function fetchLeads(params: {
  page?: number;
  limit?: number;
  businessType?: string;
  status?: string;
  search?: string;
}): Promise<LeadsResult> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.businessType) qs.set("business_type", params.businessType);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);

  const data = await request<{
    leads: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/leads?${qs.toString()}`);

  return {
    leads: data.leads.map(snakeToCamel),
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export async function fetchLead(id: string): Promise<Lead> {
  const data = await request<Record<string, unknown>>(`/api/leads/${encodeURIComponent(id)}`);
  return snakeToCamel(data);
}

export async function generateLeads(businessType: string, count?: number): Promise<Lead[]> {
  const data = await request<{ leads: Record<string, unknown>[] }>("/api/leads", {
    method: "POST",
    body: JSON.stringify({ business_type: businessType, count }),
  });
  return data.leads.map(snakeToCamel);
}

export async function updateLead(
  id: string,
  data: { status?: string; notes?: string; score?: number }
): Promise<Lead> {
  const result = await request<Record<string, unknown>>(`/api/leads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return snakeToCamel(result);
}

export async function deleteLead(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/leads/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchStats(): Promise<DashboardStats> {
  const data = await request<ApiStats>("/api/stats");
  return mapStats(data);
}

export async function fetchBusinessTypes(): Promise<BusinessType[]> {
  return request<BusinessType[]>("/api/business-types");
}