export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  score: number;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes: string;
  createdAt: string;
  source?: string;
  website?: string;
  address?: string;
}

export interface DashboardStats {
  totalLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  conversionRate: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
}

const firstNames = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Daniel", "Lisa", "Matthew", "Nancy",
  "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra", "Steven", "Ashley",
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
];

const companyPrefixes = [
  "Premier", "Elite", "Summit", "Apex", "Crest", "Peak", "Prime", "Core",
  "Vanguard", "Pinnacle", "Horizon", "Catalyst", "Meridian", "Titan", "Nexus",
];

const companySuffixes = [
  "Solutions", "Services", "Group", "Partners", "Associates", "Consulting",
  "Enterprises", "Ventures", "Industries", "Professionals", "Pro", "Co",
];

const businessTypes = [
  "Real Estate", "Solar", "Insurance", "Digital Marketing", "Home Services",
  "Auto Dealership", "Roofing", "Landscaping", "Cleaning Services",
  "IT Services", "Financial Services", "Healthcare", "Legal Services",
  "Restaurant", "E-commerce",
];

const statuses: Lead["status"][] = [
  "new", "contacted", "qualified", "converted", "lost",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  const area = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `(${area}) ${prefix}-${line}`;
}

function randomDate(daysBack: number): string {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return past.toISOString();
}

function generateLeads(count: number, businessType?: string): Lead[] {
  const leads: Lead[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const bt = businessType || randomItem(businessTypes);
    leads.push({
      id: `lead-${Date.now()}-${i}`,
      companyName: `${randomItem(companyPrefixes)} ${randomItem(companySuffixes)}`,
      contactName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: randomPhone(),
      businessType: bt,
      score: Math.floor(Math.random() * 100),
      status: randomItem(statuses),
      notes: "",
      createdAt: randomDate(30),
      source: randomItem(["Website", "Referral", "LinkedIn", "Email Campaign", "Trade Show"]),
      website: `https://www.${firstName.toLowerCase()}${lastName.toLowerCase()}.com`,
      address: `${Math.floor(Math.random() * 9000) + 1000} ${randomItem(["Oak", "Maple", "Cedar", "Pine", "Elm", "Birch", "Walnut"])} ${randomItem(["St", "Ave", "Blvd", "Dr", "Ln", "Way"])}, ${randomItem(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Austin"])}, ${randomItem(["NY", "CA", "IL", "TX", "AZ", "PA", "FL", "OH"])} ${Math.floor(Math.random() * 90000) + 10000}`,
    });
  }
  return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Generate a pool of mock leads
const allMockLeads = generateLeads(50);

export function getMockLeads(params: {
  page?: number;
  limit?: number;
  businessType?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}): { leads: Lead[]; total: number; page: number; totalPages: number } {
  let filtered = [...allMockLeads];

  if (params.businessType && params.businessType !== "all") {
    filtered = filtered.filter(
      (l) => l.businessType.toLowerCase() === params.businessType!.toLowerCase()
    );
  }

  if (params.status && params.status !== "all") {
    filtered = filtered.filter((l) => l.status === params.status);
  }

  if (params.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.contactName.toLowerCase().includes(s) ||
        l.companyName.toLowerCase().includes(s) ||
        l.email.toLowerCase().includes(s)
    );
  }

  // Sort
  const sortBy = params.sortBy || "createdAt";
  const sortOrder = params.sortOrder || "desc";
  filtered.sort((a: any, b: any) => {
    const cmp = a[sortBy] > b[sortBy] ? 1 : -1;
    return sortOrder === "desc" ? -cmp : cmp;
  });

  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const leads = filtered.slice(start, start + limit);

  return { leads, total, page, totalPages };
}

export function getMockLeadById(id: string): Lead | undefined {
  return allMockLeads.find((l) => l.id === id);
}

export function getMockStats(): DashboardStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 24 * 60 * 60 * 1000);

  const leadsToday = allMockLeads.filter((l) => new Date(l.createdAt) >= todayStart).length;
  const leadsThisWeek = allMockLeads.filter((l) => new Date(l.createdAt) >= weekStart).length;
  const totalLeads = allMockLeads.length;
  const converted = allMockLeads.filter((l) => l.status === "converted").length;
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

  return {
    totalLeads,
    leadsToday,
    leadsThisWeek,
    conversionRate,
    newLeads: allMockLeads.filter((l) => l.status === "new").length,
    contactedLeads: allMockLeads.filter((l) => l.status === "contacted").length,
    qualifiedLeads: allMockLeads.filter((l) => l.status === "qualified").length,
  };
}

export function generateMockLeads(businessType: string): Lead[] {
  const newLeads = generateLeads(5, businessType);
  allMockLeads.unshift(...newLeads);
  return newLeads;
}

export function updateMockLeadStatus(id: string, status: Lead["status"]): Lead | undefined {
  const lead = allMockLeads.find((l) => l.id === id);
  if (lead) {
    lead.status = status;
  }
  return lead;
}

export { businessTypes };