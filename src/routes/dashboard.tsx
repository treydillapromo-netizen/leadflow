import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Header from "~/components/Header";
import BusinessTypeSelector from "~/components/BusinessTypeSelector";
import GenerateButton from "~/components/GenerateButton";
import DashboardStats from "~/components/DashboardStats";
import LeadList from "~/components/LeadList";
import {
  fetchLeads,
  fetchStats,
  generateLeads,
  updateLead,
  type DashboardStats as DashboardStatsType,
  type Lead,
} from "~/lib/api";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
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
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

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
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleGenerate = async () => {
    if (!businessType) return;
    setGenerating(true);
    try {
      await generateLeads(businessType, 5);
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

        {/* Generator Section */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <BusinessTypeSelector value={businessType} onChange={setBusinessType} />
            </div>
            <GenerateButton
              onClick={handleGenerate}
              loading={generating}
              disabled={generating}
              businessType={businessType}
            />
          </div>
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
                // API sorts by created_at desc by default
                setPage(1);
              }}
              onStatusChange={handleStatusChange}
              search={search}
              statusFilter={statusFilter}
            />
          )}
        </div>
      </main>
    </div>
  );
}