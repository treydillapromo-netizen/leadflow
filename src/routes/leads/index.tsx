import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Header from "~/components/Header";
import LeadList from "~/components/LeadList";
import { fetchLeads, updateLead, type Lead } from "~/lib/api";

export const Route = createFileRoute("/leads/")({
  component: LeadsPage,
});

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLeads({
        page,
        limit: 20,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      setLeads(result.leads);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleStatusChange = async (id: string, status: Lead["status"]) => {
    try {
      await updateLead(id, { status });
      loadLeads();
    } catch (err) {
      console.error("Failed to update lead status:", err);
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse, filter, and manage your entire lead pipeline
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load leads: {error}
            </div>
          ) : (
            <LeadList
              leads={leads}
              loading={loading}
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
      </main>
    </div>
  );
}