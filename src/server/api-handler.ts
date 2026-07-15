import { sql } from "../db";
import { migrate } from "../db/schema";

// ── Helpers ───────────────────────────────────────────────────────

function serializeLead(row: Record<string, unknown>) {
  return {
    id: row.id,
    business_type: row.business_type,
    company_name: row.company_name,
    contact_name: row.contact_name ?? null,
    job_title: row.job_title ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    linkedin_url: row.linkedin_url ?? null,
    company_description: row.company_description ?? null,
    address: row.address ?? null,
    source: row.source,
    source_detail: row.source_detail ?? null,
    status: row.status,
    score: row.score,
    notes: row.notes ?? null,
    context_notes: row.context_notes ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Safe DB access ─────────────────────────────────────────────────

let dbAvailable: boolean | null = null;
let memoryStore: {
  leads: Map<string, Record<string, unknown>>;
  businessTypes: { id: string; name: string; description: string | null; is_active: boolean }[];
  nextId: number;
} = {
  leads: new Map(),
  businessTypes: [
    { id: "bt-real-estate", name: "Real Estate", description: "Real estate agents, brokers, agencies", is_active: true },
    { id: "bt-dental", name: "Dental", description: "Dental practices and clinics", is_active: true },
    { id: "bt-legal", name: "Legal", description: "Law firms and attorneys", is_active: true },
    { id: "bt-plumbing", name: "Plumbing", description: "Plumbing contractors and services", is_active: true },
    { id: "bt-hvac", name: "HVAC", description: "Heating, ventilation, and air conditioning", is_active: true },
    { id: "bt-marketing", name: "Marketing Agency", description: "Digital marketing and creative agencies", is_active: true },
    { id: "bt-saas", name: "Software / SaaS", description: "Software and SaaS companies", is_active: true },
    { id: "bt-restaurant", name: "Restaurant", description: "Restaurants and food service", is_active: true },
    { id: "bt-insurance", name: "Insurance", description: "Insurance agencies and brokers", is_active: true },
    { id: "bt-medical", name: "Medical Practice", description: "Medical clinics and physician practices", is_active: true },
    { id: "bt-cleaning", name: "Cleaning Service", description: "Commercial and residential cleaning", is_active: true },
    { id: "bt-landscaping", name: "Landscaping", description: "Landscaping and lawn care services", is_active: true },
  ],
  nextId: 1,
};

function getDb() {
  if (dbAvailable === null) {
    try {
      sql();
      dbAvailable = true;
    } catch {
      dbAvailable = false;
      console.log("DATABASE_URL not set — using in-memory fallback for API");
    }
  }
  if (!dbAvailable) return null;
  return sql();
}

function genId(): string {
  return `mem-${memoryStore.nextId++}-${Date.now()}`;
}

// ── Lead source definitions with quality tiers ─────────────────────

interface SourceDef {
  label: string;
  detail: string;
  baseScore: number; // base score range floor
  contextTemplates: string[];
}

const LEAD_SOURCES: Record<string, SourceDef> = {
  referral: {
    label: "Referral",
    detail: "Referred by industry contact",
    baseScore: 60,
    contextTemplates: [
      "Referred by a mutual connection who recommended they are actively looking for new solutions.",
      "Warm introduction through professional network — they expressed interest in exploring options.",
      "Recommended by a satisfied client — decision-maker is evaluating vendors this quarter.",
    ],
  },
  event: {
    label: "Industry Event",
    detail: "Met at trade show / conference",
    baseScore: 50,
    contextTemplates: [
      "Connected at a recent industry conference — they stopped by the booth and left their card.",
      "Attended a webinar and asked detailed questions — showing active purchase intent.",
      "Panel attendee who reached out afterward asking for a capabilities overview.",
    ],
  },
  linkedin: {
    label: "LinkedIn",
    detail: "Active on LinkedIn — engaged with content",
    baseScore: 40,
    contextTemplates: [
      "Recently engaged with multiple industry posts — signaling exploration in this space.",
      "Changed roles recently — new decision-makers often evaluate vendors within 90 days.",
      "Has been viewing competitor profiles, suggesting they are in-market.",
    ],
  },
  web: {
    label: "Website Inquiry",
    detail: "Submitted inquiry through website",
    baseScore: 45,
    contextTemplates: [
      "Submitted a contact form requesting pricing information — high intent signal.",
      "Downloaded a whitepaper and pricing guide — actively researching solutions.",
      "Requested a demo through the website — timeline suggests Q3 decision.",
    ],
  },
  directory: {
    label: "Directory Listing",
    detail: "Found via business directory",
    baseScore: 30,
    contextTemplates: [
      "Listed in a premium business directory — recently updated their profile.",
      "Has strong reviews on industry platforms — looking to expand their vendor relationships.",
      "Directory profile indicates growth — recent hires suggest expanding needs.",
    ],
  },
};

// ── Rich mock data catalog ─────────────────────────────────────────

interface MockEntry {
  company: string;
  contactName: string;
  jobTitle: string;
  domain: string;
  phone: string;
  description: string;
  address: string;
  linkedinSlug: string;
}

const RICH_MOCK_DATA: Record<string, MockEntry[]> = {
  "Real Estate": [
    { company: "Summit Realty Group", contactName: "Sarah Mitchell", jobTitle: "Managing Broker", domain: "summitrealty.com", phone: "(512) 201-1000", description: "Full-service residential brokerage serving the Austin metro area. Specializes in luxury homes and first-time buyers with a team of 45 agents.", address: "Austin, TX", linkedinSlug: "summit-realty-group" },
    { company: "Coastal Properties Inc", contactName: "James Rodriguez", jobTitle: "Director of Sales", domain: "coastalprops.com", phone: "(619) 201-1001", description: "San Diego-based commercial real estate firm focused on office and retail leasing. Manages over 2M sq ft of commercial space.", address: "San Diego, CA", linkedinSlug: "coastal-properties-inc" },
    { company: "Heritage Homes Realty", contactName: "Lisa Chen", jobTitle: "VP of Operations", domain: "heritagehomes.com", phone: "(615) 201-1002", description: "Leading Nashville residential brokerage with deep roots in historic property transactions. Top 3 in market share for homes over $1M.", address: "Nashville, TN", linkedinSlug: "heritage-homes-realty" },
    { company: "Pinnacle Real Estate", contactName: "Michael Thompson", jobTitle: "Principal Broker", domain: "pinnaclerealestate.com", phone: "(720) 201-1003", description: "Denver-based boutique firm specializing in mountain and resort properties across Colorado. Awarded Best of Denver 2025.", address: "Denver, CO", linkedinSlug: "pinnacle-real-estate" },
    { company: "Metro Property Partners", contactName: "Jennifer Park", jobTitle: "Acquisitions Manager", domain: "metroproperty.com", phone: "(404) 201-1004", description: "Atlanta commercial investment firm focused on multi-family acquisitions and property management. $500M portfolio under management.", address: "Atlanta, GA", linkedinSlug: "metro-property-partners" },
    { company: "Golden Gate Estates", contactName: "David Williams", jobTitle: "Senior Agent", domain: "goldengateestates.com", phone: "(415) 201-1005", description: "San Francisco luxury residential specialists. Consistent top producer in the Bay Area with average deal size over $2.5M.", address: "San Francisco, CA", linkedinSlug: "golden-gate-estates" },
    { company: "Blue Sky Realty", contactName: "Amanda Brooks", jobTitle: "Marketing Director", domain: "blueskyrealty.com", phone: "(480) 201-1006", description: "Phoenix-area brokerage leading in new construction sales. Partnered with 12 major homebuilders in the Valley.", address: "Phoenix, AZ", linkedinSlug: "blue-sky-realty" },
    { company: "Cornerstone Real Estate", contactName: "Robert Keller", jobTitle: "Team Lead", domain: "cornerstonere.com", phone: "(704) 201-1007", description: "Charlotte-based team of 20 agents delivering comprehensive residential services. #1 Keller Williams team in the Carolinas.", address: "Charlotte, NC", linkedinSlug: "cornerstone-real-estate" },
    { company: "Elite Home Advisors", contactName: "Michelle Davis", jobTitle: "Client Relations Manager", domain: "elitehomeadvisors.com", phone: "(813) 201-1008", description: "Tampa Bay real estate consultancy providing concierge-level service for relocating executives and their families.", address: "Tampa, FL", linkedinSlug: "elite-home-advisors" },
    { company: "Premier Living Realty", contactName: "Christopher Lee", jobTitle: "Owner / Broker", domain: "premierliving.com", phone: "(503) 201-1009", description: "Portland-based independent brokerage focused on sustainable and eco-friendly properties. Certified green real estate specialists.", address: "Portland, OR", linkedinSlug: "premier-living-realty" },
  ],
  "Dental": [
    { company: "Bright Smile Dental", contactName: "Dr. Emily Foster", jobTitle: "Owner / Lead Dentist", domain: "brightsmiledental.com", phone: "(312) 301-2000", description: "Modern Chicago dental practice specializing in cosmetic dentistry and Invisalign. 4.9 stars on Google with 200+ reviews.", address: "Chicago, IL", linkedinSlug: "bright-smile-dental" },
    { company: "ClearView Dental Care", contactName: "Dr. Kevin Nguyen", jobTitle: "Practice Owner", domain: "clearviewdental.com", phone: "(714) 301-2001", description: "Orange County family dental practice with 3 locations and growing. Recently expanded into pediatric dentistry.", address: "Irvine, CA", linkedinSlug: "clearview-dental-care" },
    { company: "Gentle Touch Dentistry", contactName: "Dr. Rachel Green", jobTitle: "Partner / Dentist", domain: "gentletouchdentistry.com", phone: "(617) 301-2002", description: "Boston boutique dental practice known for sedation dentistry and patient comfort. Accepts all major insurance plans.", address: "Boston, MA", linkedinSlug: "gentle-touch-dentistry" },
    { company: "Premier Dental Associates", contactName: "Dr. Steven Park", jobTitle: "Clinical Director", domain: "premierdentalassoc.com", phone: "(973) 301-2003", description: "North Jersey multi-specialty group with orthodontics, periodontics, and general dentistry under one roof.", address: "Paramus, NJ", linkedinSlug: "premier-dental-associates" },
    { company: "Family First Dental", contactName: "Dr. Maria Santos", jobTitle: "Owner Dentist", domain: "familyfirstdental.com", phone: "(210) 301-2004", description: "San Antonio practice focused on serving families and underserved communities. Bilingual staff and flexible payment plans.", address: "San Antonio, TX", linkedinSlug: "family-first-dental" },
    { company: "Sunrise Dental Studio", contactName: "Dr. Andrew Cole", jobTitle: "Owner / Cosmetic Dentist", domain: "sunrisedentalstudio.com", phone: "(954) 301-2005", description: "Fort Lauderdale cosmetic and implant dentistry studio. State-of-the-art CEREC same-day crown technology.", address: "Fort Lauderdale, FL", linkedinSlug: "sunrise-dental-studio" },
    { company: "Oak Park Dental Group", contactName: "Dr. Jessica Hart", jobTitle: "Practice Manager / Dentist", domain: "oakparkdental.com", phone: "(708) 301-2006", description: "Long-established Chicago suburban practice with strong community ties. 30+ years serving Oak Park families.", address: "Oak Park, IL", linkedinSlug: "oak-park-dental-group" },
    { company: "Modern Bite Dentistry", contactName: "Dr. Brian Wood", jobTitle: "Founder", domain: "modernbitedds.com", phone: "(206) 301-2007", description: "Seattle tech-forward dental startup using AI diagnostics. Featured in Dental Economics for innovative practice model.", address: "Seattle, WA", linkedinSlug: "modern-bite-dentistry" },
    { company: "Harmony Dental Clinic", contactName: "Dr. Laura Kim", jobTitle: "Lead Dentist", domain: "harmonydentalclinic.com", phone: "(702) 301-2008", description: "Las Vegas practice offering emergency and cosmetic dentistry with extended hours. Open 7 days a week.", address: "Las Vegas, NV", linkedinSlug: "harmony-dental-clinic" },
    { company: "Evergreen Dental Arts", contactName: "Dr. Thomas Wright", jobTitle: "Owner", domain: "evergreendentalarts.com", phone: "(303) 301-2009", description: "Boulder holistic dental practice combining traditional care with natural remedies. Mercury-free and biocompatible focus.", address: "Boulder, CO", linkedinSlug: "evergreen-dental-arts" },
  ],
  "Legal": [
    { company: "Meridian Law Group", contactName: "Jonathan Blake", jobTitle: "Managing Partner", domain: "meridianlawgroup.com", phone: "(212) 401-3000", description: "Midtown Manhattan corporate law firm specializing in M&A and securities. 25 attorneys, primarily Fortune 500 clients.", address: "New York, NY", linkedinSlug: "meridian-law-group" },
    { company: "Crestview Legal Partners", contactName: "Catherine Moore", jobTitle: "Senior Partner, Litigation", domain: "crestviewlegal.com", phone: "(310) 401-3001", description: "LA-based litigation firm with a strong track record in entertainment and IP law. Represented major studios and artists.", address: "Los Angeles, CA", linkedinSlug: "crestview-legal-partners" },
    { company: "Atlas Law Firm", contactName: "Richard Patel", jobTitle: "Founding Partner", domain: "atlaslawfirm.com", phone: "(713) 401-3002", description: "Houston energy-sector law firm specializing in oil & gas contracts, regulatory compliance, and land use.", address: "Houston, TX", linkedinSlug: "atlas-law-firm" },
    { company: "Bridgewater Attorneys at Law", contactName: "Sandra Lewis", jobTitle: "Partner, Family Law", domain: "bridgewaterattorneys.com", phone: "(603) 401-3003", description: "New England firm focused on family law, estate planning, and probate. Highly rated on Avvo and Martindale-Hubbell.", address: "Manchester, NH", linkedinSlug: "bridgewater-attorneys" },
    { company: "Sterling Legal Associates", contactName: "Mark Hendricks", jobTitle: "Partner, Corporate", domain: "sterlinglegal.com", phone: "(202) 401-3004", description: "DC boutique firm handling regulatory compliance, government contracts, and white-collar defense.", address: "Washington, DC", linkedinSlug: "sterling-legal-associates" },
    { company: "NorthStar Law Offices", contactName: "Diana Russell", jobTitle: "Managing Attorney", domain: "northstarlaw.com", phone: "(612) 401-3005", description: "Minneapolis general practice firm serving small-to-mid-size businesses. Flat-fee billing model gaining traction.", address: "Minneapolis, MN", linkedinSlug: "northstar-law-offices" },
    { company: "Capitol Legal Group", contactName: "Patrick O'Brien", jobTitle: "Partner", domain: "capitollegalgroup.com", phone: "(512) 401-3006", description: "Austin firm focused on tech startups: incorporation, funding rounds, IP protection. Worked with 200+ startups.", address: "Austin, TX", linkedinSlug: "capitol-legal-group" },
    { company: "Harbor Law Collective", contactName: "Victoria Chang", jobTitle: "Partner, Immigration", domain: "harborlawcollective.com", phone: "(415) 401-3007", description: "SF-based immigration law collective. Specializes in H-1B, green cards, and citizenship for tech workers.", address: "San Francisco, CA", linkedinSlug: "harbor-law-collective" },
    { company: "Apex Litigation Firm", contactName: "Frank Morrison", jobTitle: "Lead Trial Attorney", domain: "apexlitigation.com", phone: "(305) 401-3008", description: "Miami trial firm known for high-stakes personal injury and class action cases. Multiple $10M+ verdicts.", address: "Miami, FL", linkedinSlug: "apex-litigation-firm" },
    { company: "Pacific Crest Legal", contactName: "Natalie Reyes", jobTitle: "Partner, Employment Law", domain: "pacificcrestlegal.com", phone: "(503) 401-3009", description: "Portland employment law specialists representing both employers and executives. Mediation-first approach.", address: "Portland, OR", linkedinSlug: "pacific-crest-legal" },
  ],
  "Plumbing": [
    { company: "FlowRight Plumbing", contactName: "Mike Turner", jobTitle: "Owner / Master Plumber", domain: "flowrightplumbing.com", phone: "(214) 501-4000", description: "Dallas-based residential and commercial plumbing service. 24/7 emergency service with 15 trucks on the road.", address: "Dallas, TX", linkedinSlug: "flowright-plumbing" },
    { company: "Apex Pipe Services", contactName: "Jose Ramirez", jobTitle: "General Manager", domain: "apexpipeservices.com", phone: "(602) 501-4001", description: "Phoenix commercial plumbing contractor specializing in new construction and tenant improvements. LEED certified.", address: "Phoenix, AZ", linkedinSlug: "apex-pipe-services" },
    { company: "Green Valley Plumbing", contactName: "Dave Kowalski", jobTitle: "Co-Owner", domain: "greenvalleyplumbing.com", phone: "(845) 501-4002", description: "Hudson Valley family-owned plumbing business with 40 years of service. Specializes in historic home renovations.", address: "Poughkeepsie, NY", linkedinSlug: "green-valley-plumbing" },
    { company: "RapidRooter Plumbing", contactName: "Tom Henderson", jobTitle: "Operations Manager", domain: "rapidrooter.com", phone: "(916) 501-4003", description: "Sacramento drain and sewer specialists. Trenchless repair technology — minimal disruption to landscaping.", address: "Sacramento, CA", linkedinSlug: "rapid-rooter-plumbing" },
    { company: "Heritage Plumbing Co", contactName: "Chris Baldwin", jobTitle: "Owner", domain: "heritageplumbingco.com", phone: "(781) 501-4004", description: "Boston-area plumbing company with expertise in older New England homes. Steam and hydronic heating specialists.", address: "Cambridge, MA", linkedinSlug: "heritage-plumbing-co" },
    { company: "BlueStream Plumbing", contactName: "Luis Fernandez", jobTitle: "Service Manager", domain: "bluestreamplumbing.com", phone: "(305) 501-4005", description: "Miami plumbing service known for fast response times. Bilingual crews serving Dade and Broward counties.", address: "Miami, FL", linkedinSlug: "bluestream-plumbing" },
    { company: "Precision Pipe Works", contactName: "Ron Wheeler", jobTitle: "Project Estimator", domain: "precisionpipeworks.com", phone: "(425) 501-4006", description: "Seattle-area new construction plumbing contractor. Preferred vendor for 3 major PNW homebuilders.", address: "Bellevue, WA", linkedinSlug: "precision-pipe-works" },
    { company: "Hometown Plumbers", contactName: "Gary Simmons", jobTitle: "Co-Owner", domain: "hometownplumbers.com", phone: "(614) 501-4007", description: "Columbus residential plumbing service with a focus on water heater installation and maintenance. Same-day service.", address: "Columbus, OH", linkedinSlug: "hometown-plumbers" },
    { company: "Capitol Plumbing Solutions", contactName: "Steve Crawford", jobTitle: "President", domain: "capitolplumbingsolutions.com", phone: "(703) 501-4008", description: "Northern Virginia commercial plumbing contractor serving government and defense facilities. Security-cleared staff.", address: "Arlington, VA", linkedinSlug: "capitol-plumbing-solutions" },
    { company: "EverFlow Plumbing & Drain", contactName: "Dan O'Malley", jobTitle: "Owner / Operator", domain: "everflowplumbing.com", phone: "(801) 501-4009", description: "Salt Lake City plumbing company with a strong maintenance contract base. 200+ commercial maintenance agreements.", address: "Salt Lake City, UT", linkedinSlug: "everflow-plumbing-drain" },
  ],
  "HVAC": [
    { company: "Comfort Air Systems", contactName: "Alan Reeves", jobTitle: "General Manager", domain: "comfortairsystems.com", phone: "(404) 601-5000", description: "Atlanta commercial HVAC contractor specializing in office building retrofits and energy-efficiency upgrades.", address: "Atlanta, GA", linkedinSlug: "comfort-air-systems" },
    { company: "Arctic Breeze Heating & Cooling", contactName: "Patricia Wells", jobTitle: "Owner", domain: "arcticbreezehvac.com", phone: "(763) 601-5001", description: "Minneapolis-area residential HVAC company. Mitsubishi Diamond Contractor — top 5% installer nationwide.", address: "Bloomington, MN", linkedinSlug: "arctic-breeze-hvac" },
    { company: "Sun State Air Conditioning", contactName: "Carlos Mendez", jobTitle: "Service Director", domain: "sunstateac.com", phone: "(813) 601-5002", description: "Tampa HVAC service and installation. 5-star rated on Yelp with a focus on ductless mini-split systems.", address: "Tampa, FL", linkedinSlug: "sun-state-ac" },
    { company: "Peak Climate Control", contactName: "Ryan Douglas", jobTitle: "VP of Operations", domain: "peakclimate.com", phone: "(720) 601-5003", description: "Denver high-altitude HVAC specialists. Expert in heat pump installations for Colorado's unique climate needs.", address: "Denver, CO", linkedinSlug: "peak-climate-control" },
    { company: "MetroCool Mechanical", contactName: "Sharon Baker", jobTitle: "Project Manager", domain: "metrocoolmech.com", phone: "(718) 601-5004", description: "NYC-based mechanical contractor for large multifamily buildings. Steam-to-gas conversion specialists.", address: "Brooklyn, NY", linkedinSlug: "metrocool-mechanical" },
  ],
  "Marketing Agency": [
    { company: "Forge Digital", contactName: "Alex Rivera", jobTitle: "CEO / Founder", domain: "forgedigital.co", phone: "(415) 701-6000", description: "SF-based performance marketing agency. Specializes in B2B SaaS lead gen. Clients include 3 YC unicorns.", address: "San Francisco, CA", linkedinSlug: "forge-digital-agency" },
    { company: "Bloom Creative Studio", contactName: "Taylor Morgan", jobTitle: "Creative Director", domain: "bloomcreative.studio", phone: "(512) 701-6001", description: "Austin creative agency focused on brand identity and web design for DTC brands. Webby Award winner 2025.", address: "Austin, TX", linkedinSlug: "bloom-creative-studio" },
    { company: "Northlight Media", contactName: "Jordan Hayes", jobTitle: "Managing Director", domain: "northlightmedia.com", phone: "(206) 701-6002", description: "Seattle full-service agency with in-house video production. Specializes in outdoor and lifestyle brands.", address: "Seattle, WA", linkedinSlug: "northlight-media" },
    { company: "Catalyst Growth Partners", contactName: "Riley Chen", jobTitle: "Growth Strategist", domain: "catalystgrowth.io", phone: "(646) 701-6003", description: "NYC growth marketing consultancy focused on Series A+ startups. Average client ROI: 4.2x.", address: "New York, NY", linkedinSlug: "catalyst-growth-partners" },
    { company: "Pulse Social Agency", contactName: "Sam Wilson", jobTitle: "Head of Client Services", domain: "pulsesocial.agency", phone: "(310) 701-6004", description: "LA social media agency with a roster of influencer and entertainment clients. TikTok-first creative strategy.", address: "Los Angeles, CA", linkedinSlug: "pulse-social-agency" },
  ],
};

// Generic fallback generator for business types not in RICH_MOCK_DATA
function generateMockEntry(businessType: string, index: number): MockEntry {
  const slug = businessType.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const cities = [
    { name: "New York, NY", code: "212" },
    { name: "Los Angeles, CA", code: "310" },
    { name: "Chicago, IL", code: "312" },
    { name: "Houston, TX", code: "713" },
    { name: "Phoenix, AZ", code: "602" },
    { name: "Philadelphia, PA", code: "215" },
    { name: "San Antonio, TX", code: "210" },
    { name: "San Diego, CA", code: "619" },
    { name: "Dallas, TX", code: "214" },
    { name: "Austin, TX", code: "512" },
  ];
  const city = cities[index % cities.length];
  const suffixes = ["Pro", "Hub", "Works", "Lab", "Genius", "Now", "X", "Plus", "HQ", "Direct"];
  const contactNames = ["Alex Morgan", "Jordan Taylor", "Casey Rivera", "Morgan Lee", "Taylor Brooks", "Riley Cooper", "Avery Quinn", "Cameron Hayes", "Dakota Reed", "Finley Shaw"];
  const jobTitles = ["Owner", "General Manager", "Director of Operations", "VP", "Founder", "Managing Partner", "Principal", "Team Lead", "Department Head", "Senior Manager"];

  return {
    company: `${businessType} ${suffixes[index]}`,
    contactName: contactNames[index],
    jobTitle: jobTitles[index],
    domain: `${slug}${index > 0 ? index + 1 : ""}.com`,
    phone: `(${city.code}) ${rand(600, 999)}-${String(rand(0, 9999)).padStart(4, "0")}`,
    description: `${businessType} business based in ${city.name}. Established and serving the local community with quality service.`,
    address: city.name,
    linkedinSlug: `${slug}-${index > 0 ? index + 1 : ""}`,
  };
}

function getMockEntries(businessType: string): MockEntry[] {
  return RICH_MOCK_DATA[businessType] ?? Array.from({ length: 10 }, (_, i) => generateMockEntry(businessType, i));
}

// ── Smart scoring engine ───────────────────────────────────────────

function calculateScore(entry: MockEntry, sourceKey: string): number {
  const sourceDef = LEAD_SOURCES[sourceKey] ?? LEAD_SOURCES.directory;

  // Base score from source quality
  let score = sourceDef.baseScore + rand(0, 19);

  // Completeness bonus: up to 15 points for having all rich fields
  let completenessBonus = 0;
  if (entry.description?.length > 50) completenessBonus += 5;
  if (entry.address) completenessBonus += 3;
  if (entry.jobTitle && entry.jobTitle.length > 3) completenessBonus += 4;
  if (entry.linkedinSlug) completenessBonus += 3;
  score += completenessBonus;

  // Cap at 95 — nobody's perfect
  return Math.min(score, 95);
}

// ── Route handlers ─────────────────────────────────────────────────

async function handleGetLeads(url: URL): Promise<Response> {
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
  const business_type = url.searchParams.get("business_type") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const sort = url.searchParams.get("sort") ?? "created_at";

  const s = getDb();
  if (!s) {
    let leads = Array.from(memoryStore.leads.values());
    if (business_type) leads = leads.filter((l) => l.business_type === business_type);
    if (status) leads = leads.filter((l) => l.status === status);
    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter(
        (l) =>
          String(l.company_name ?? "").toLowerCase().includes(q) ||
          String(l.contact_name ?? "").toLowerCase().includes(q) ||
          String(l.email ?? "").toLowerCase().includes(q) ||
          String(l.company_description ?? "").toLowerCase().includes(q) ||
          String(l.job_title ?? "").toLowerCase().includes(q),
      );
    }
    // Default sort: highest score first
    if (sort === "score") {
      leads.sort((a, b) => (b.score as number) - (a.score as number));
    } else {
      leads.sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime());
    }
    const total = leads.length;
    const offset = (page - 1) * limit;
    const paged = leads.slice(offset, offset + limit);
    return Response.json({
      leads: paged.map(serializeLead),
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  }

  // Database path — build parameterized SQL for Neon compatibility
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (business_type) { params.push(business_type); conditions.push("business_type = $" + params.length); }
  if (status) { params.push(status); conditions.push("status = $" + params.length); }
  if (search) {
    params.push("%" + search + "%");
    const p = params.length;
    conditions.push("(company_name ilike $" + p + " or contact_name ilike $" + p + " or email ilike $" + p + " or company_description ilike $" + p + ")");
  }
  const whereClause = conditions.length > 0 ? "where " + conditions.join(" and ") : "";
  const offset = (page - 1) * limit;
  const orderCol = sort === "score" ? "score desc" : "created_at desc";

  // Neon driver: function-call syntax (sql(query, ...params))
  const countSQL = "select count(*)::int as total from leads " + whereClause;
  const leadsSQL = "select * from leads " + whereClause + " order by " + orderCol + " limit $" + (params.length + 1) + " offset $" + (params.length + 2);
  const allParams = [...params, limit, offset];

  const [countResult, rows] = await Promise.all([
    (s as any).query(countSQL, params),
    (s as any).query(leadsSQL, allParams),
  ]);
  const total = (countResult[0] as { total: number }).total;
  return Response.json({
    leads: (rows as Record<string, unknown>[]).map(serializeLead),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
}

async function handlePostLeads(req: Request): Promise<Response> {
  const body = await req.json() as { business_type?: string; count?: number };
  const business_type = body.business_type;
  if (!business_type) return Response.json({ error: "business_type is required" }, { status: 400 });

  const count = Math.min(body.count ?? rand(5, 8), 15);
  const entries = shuffle(getMockEntries(business_type));
  const sourceKeys = shuffle(Object.keys(LEAD_SOURCES));

  const s = getDb();
  if (!s) {
    const leads: Record<string, unknown>[] = [];
    for (let i = 0; i < count; i++) {
      const entry = entries[i % entries.length];
      const sourceKey = sourceKeys[i % sourceKeys.length];
      const sourceDef = LEAD_SOURCES[sourceKey];
      const score = calculateScore(entry, sourceKey);
      const firstName = entry.contactName.split(" ")[0].toLowerCase();
      const contextNote = pick(sourceDef.contextTemplates);
      const now = new Date().toISOString();

      const lead: Record<string, unknown> = {
        id: genId(),
        business_type,
        company_name: entry.company,
        contact_name: entry.contactName,
        job_title: entry.jobTitle,
        email: `${firstName}@${entry.domain}`,
        phone: entry.phone,
        website: `https://www.${entry.domain}`,
        linkedin_url: `https://linkedin.com/company/${entry.linkedinSlug}`,
        company_description: entry.description,
        address: entry.address,
        source: sourceDef.label,
        source_detail: sourceDef.detail,
        status: "new",
        score,
        notes: null,
        context_notes: contextNote,
        created_at: now,
        updated_at: now,
      };
      memoryStore.leads.set(lead.id as string, lead);
      leads.push(lead);
    }
    if (!memoryStore.businessTypes.some((bt) => bt.name === business_type)) {
      memoryStore.businessTypes.push({
        id: `bt-${business_type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: business_type,
        description: `Auto-generated: ${business_type} leads`,
        is_active: true,
      });
    }
    leads.sort((a, b) => (b.score as number) - (a.score as number));
    return Response.json({ leads: leads.map(serializeLead) });
  }

  // Database path — insert rich data
  await s`insert into business_types (name, description) values (${business_type}, ${`Auto-generated: ${business_type} leads`}) on conflict (name) do nothing;`;
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const entry = entries[i % entries.length];
    const sourceKey = sourceKeys[i % sourceKeys.length];
    const sourceDef = LEAD_SOURCES[sourceKey];
    const score = calculateScore(entry, sourceKey);
    const firstName = entry.contactName.split(" ")[0].toLowerCase();
    const contextNote = pick(sourceDef.contextTemplates);

    const result = await s`
      insert into leads (business_type, company_name, contact_name, job_title, email, phone, website, linkedin_url, company_description, address, source, source_detail, status, score, context_notes)
      values (${business_type}, ${entry.company}, ${entry.contactName}, ${entry.jobTitle}, ${`${firstName}@${entry.domain}`}, ${entry.phone}, ${`https://www.${entry.domain}`}, ${`https://linkedin.com/company/${entry.linkedinSlug}`}, ${entry.description}, ${entry.address}, ${sourceDef.label}, ${sourceDef.detail}, ${"new"}, ${score}, ${contextNote})
      returning id
    `;
    ids.push((result[0] as { id: string }).id);
  }
  const rows = await s`select * from leads where id = any(${ids}) order by score desc`;
  return Response.json({ leads: (rows as Record<string, unknown>[]).map(serializeLead) });
}

async function handleLeadById(method: string, id: string, req?: Request): Promise<Response> {
  const s = getDb();
  if (!s) {
    if (method === "GET") {
      const lead = memoryStore.leads.get(id);
      if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
      return Response.json(serializeLead(lead));
    }
    if (method === "PATCH" && req) {
      const lead = memoryStore.leads.get(id);
      if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
      const body = await req.json() as Record<string, unknown>;
      const allowedFields = ["status", "notes", "score", "contact_name", "email", "phone", "company_name", "business_type", "job_title", "linkedin_url", "company_description", "address", "context_notes"];
      for (const field of allowedFields) {
        if (field in body) lead[field] = body[field];
      }
      if (body.status && !["new", "contacted", "qualified", "converted", "lost"].includes(body.status as string)) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }
      lead.updated_at = new Date().toISOString();
      return Response.json(serializeLead(lead));
    }
    if (method === "DELETE") {
      const existed = memoryStore.leads.delete(id);
      if (!existed) return Response.json({ error: "Lead not found" }, { status: 404 });
      return Response.json({ deleted: true });
    }
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (method === "GET") {
    const rows = await s`select * from leads where id = ${id}`;
    if (rows.length === 0) return Response.json({ error: "Lead not found" }, { status: 404 });
    return Response.json(serializeLead(rows[0] as Record<string, unknown>));
  }
  if (method === "PATCH" && req) {
    const body = await req.json() as Record<string, unknown>;
    const allowedFields = ["status", "notes", "score", "contact_name", "email", "phone", "company_name", "business_type", "job_title", "linkedin_url", "company_description", "address", "context_notes"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }
    if (Object.keys(updates).length === 0) return Response.json({ error: "At least one updatable field required" }, { status: 400 });
    if (updates.status && !["new", "contacted", "qualified", "converted", "lost"].includes(updates.status as string)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    const setClauses: string[] = [];
    const paramsArr: unknown[] = [id];
    for (const [key, value] of Object.entries(updates)) {
      paramsArr.push(value);
      setClauses.push(key + " = $" + paramsArr.length);
    }
    setClauses.push("updated_at = now()");
    const updateSQL = "update leads set " + setClauses.join(", ") + " where id = $1 returning *";
    const rows = await (s as any).query(updateSQL, paramsArr);
    if (rows.length === 0) return Response.json({ error: "Lead not found" }, { status: 404 });
    return Response.json(serializeLead(rows[0] as Record<string, unknown>));
  }
  if (method === "DELETE") {
    const rows = await s`delete from leads where id = ${id} returning id`;
    if (rows.length === 0) return Response.json({ error: "Lead not found" }, { status: 404 });
    return Response.json({ deleted: true });
  }
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

async function handleStats(): Promise<Response> {
  const s = getDb();
  if (!s) {
    const leads = Array.from(memoryStore.leads.values());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayCount = leads.filter((l) => new Date(String(l.created_at)) >= today).length;
    const weekCount = leads.filter((l) => new Date(String(l.created_at)) >= weekStart).length;
    const monthCount = leads.filter((l) => new Date(String(l.created_at)) >= monthStart).length;

    const byStatus: Record<string, number> = {};
    const byBusinessType: Record<string, number> = {};
    let totalScore = 0;
    for (const l of leads) {
      byStatus[l.status as string] = (byStatus[l.status as string] || 0) + 1;
      byBusinessType[l.business_type as string] = (byBusinessType[l.business_type as string] || 0) + 1;
      totalScore += (l.score as number) || 0;
    }
    const avgScore = leads.length > 0 ? Math.round((totalScore / leads.length) * 10) / 10 : 0;

    return Response.json({
      total: leads.length,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      byStatus,
      byBusinessType,
      averageScore: avgScore,
    });
  }

  const [[totalRow], [todayRow], [weekRow], [monthRow], statusRows, btRows, [scoreRow]] = await Promise.all([
    s`select count(*)::int as count from leads`,
    s`select count(*)::int as count from leads where created_at >= current_date`,
    s`select count(*)::int as count from leads where created_at >= date_trunc('week', current_date)`,
    s`select count(*)::int as count from leads where created_at >= date_trunc('month', current_date)`,
    s`select status, count(*)::int as count from leads group by status`,
    s`select business_type, count(*)::int as count from leads group by business_type order by count desc limit 10`,
    s`select coalesce(round(avg(score), 1), 0) as avg_score from leads`,
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusRows as { status: string; count: number }[]) byStatus[row.status] = row.count;
  const byBusinessType: Record<string, number> = {};
  for (const row of btRows as { business_type: string; count: number }[]) byBusinessType[row.business_type] = row.count;

  return Response.json({
    total: (totalRow as { count: number }).count,
    today: (todayRow as { count: number }).count,
    thisWeek: (weekRow as { count: number }).count,
    thisMonth: (monthRow as { count: number }).count,
    byStatus, byBusinessType,
    averageScore: (scoreRow as { avg_score: number }).avg_score,
  });
}

async function handleBusinessTypes(): Promise<Response> {
  const s = getDb();
  if (!s) {
    return Response.json(memoryStore.businessTypes.filter((bt) => bt.is_active));
  }
  const rows = await s`select * from business_types where is_active = true order by name asc`;
  return Response.json(
    (rows as Record<string, unknown>[]).map((row) => ({
      id: row.id, name: row.name, description: row.description ?? null, is_active: row.is_active,
    })),
  );
}

// ── Main API handler ───────────────────────────────────────────────

let migrated = false;

export async function handleApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (!path.startsWith("/api/")) return null;

  if (!migrated) {
    const s = getDb();
    if (s) {
      try { await migrate(); } catch { /* ignore */ }
      migrated = true;
    } else {
      migrated = true;
    }
  }

  try {
    if (path === "/api/leads") {
      if (req.method === "GET") return handleGetLeads(url);
      if (req.method === "POST") return handlePostLeads(req);
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const leadMatch = path.match(/^\/api\/leads\/([^/]+)$/);
    if (leadMatch) {
      return handleLeadById(req.method, leadMatch[1], req.method === "PATCH" ? req : undefined);
    }

    if (path === "/api/stats") {
      if (req.method === "GET") return handleStats();
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (path === "/api/business-types") {
      if (req.method === "GET") return handleBusinessTypes();
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    console.error("API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
