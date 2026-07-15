import { useState, useEffect, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Header from "~/components/Header";
import BusinessTypeSelector from "~/components/BusinessTypeSelector";
import GenerateButton from "~/components/GenerateButton";
import DashboardStats from "~/components/DashboardStats";
import LeadList from "~/components/LeadList";
import TrialBanner from "~/components/TrialBanner";
import {
  fetchLeads,
  fetchStats,
  generateLeads,
  updateLead,
  type DashboardStats as DashboardStatsType,
  type Lead,
} from "~/lib/api";
import { useAuth, incrementLeadCount } from "~/lib/auth";

const STRIPE_LINKS = {
  pro: "https://buy.stripe.com/8x2dRbcqt3dA0eM0GseZ205",
  enterprise: "https://buy.stripe.com/14A4gBcqt8xU6DadteeZ206",
};

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { isAuthenticated, isTrialExpired, isLeadCapped, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [businessType, setBusinessType] = useState("");
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const result = await fetchLeads({
        page,
        limit: 10,
        businessType: businessType || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      setLeads(result.leads);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setLeadsError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLeadsLoading(false);
    }
  }, [page, businessType, statusFilter, search]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [loadStats, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadLeads();
    }
  }, [loadLeads, isAuthenticated]);

  const handleGenerate = async () => {
    if (!businessType) return;
    // If lead capped, don't generate
    if (isLeadCapped) return;
    setGenerating(true);
    try {
      const newLeads = await generateLeads(businessType, 5);
      // Increment local trial lead count for each new lead
      for (let i = 0; i < (newLeads.length || 5); i++) {
        incrementLeadCount();
      }
      await Promise.all([loadStats(), loadLeads()]);
    } catch (err) {
      console.error("Failed to generate leads:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id: string, status: Lead["status"]) => {
    try {
      await updateLead(id, { status });
      await Promise.all([loadStats(), loadLeads()]);
    } catch (err) {
      console.error("Failed to update lead status:", err);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and manage your leads
          </p>
        </div>

        {/* Trial Banner */}
        <TrialBanner />

        {/* Expired trial — show upgrade prompt */}
        {isTrialExpired ? (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Your trial has ended</h2>
            <p className="mt-2 text-gray-600">
              Subscribe to continue generating unlimited leads for your business.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <a
                href={STRIPE_LINKS.pro}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Subscribe to Pro — $49/mo
              </a>
              <a
                href={STRIPE_LINKS.enterprise}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Enterprise — $149/mo
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Generator Section — disabled if lead capped */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full sm:max-w-xs">
                  <BusinessTypeSelector value={businessType} onChange={setBusinessType} />
                </div>
                <div className="flex items-center gap-3">
                  {isLeadCapped && (
                    <p className="text-xs text-amber-600">Upgrade to generate more leads</p>
                  )}
                  <GenerateButton
                    onClick={handleGenerate}
                    loading={generating}
                    disabled={generating || isLeadCapped}
                    businessType={businessType}
                  />
                </div>
              </div>
              {isLeadCapped && (
                <div className="mt-4">
                  <a
                    href={STRIPE_LINKS.pro}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Upgrade to Pro →</a>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mb-8">
              {statsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Failed to load stats: {statsError}
                </div>
              ) : (
                <DashboardStats stats={stats} loading={statsLoading} />
              )}
            </div>

            {/* Leads List */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Leads</h2>
              {leadsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Failed to load leads: {leadsError}
                </div>
              ) : (
                <LeadList
                  leads={leads}
                  loading={leadsLoading}
                  total={total}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  onSearchChange={(s) => {
                    setSearch(s);
                    setPage(1);
                  }}
                  onStatusFilterChange={(s) => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  onSortChange={(_field, _order) => {
                    setPage(1);
                  }}
                  onStatusChange={handleStatusChange}
                  search={search}
                  statusFilter={statusFilter}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}