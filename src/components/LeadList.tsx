import { useState } from "react";
import type { Lead } from "~/lib/mock-data";
import LeadCard from "./LeadCard";

interface LeadListProps {
  leads: Lead[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  onStatusChange?: (id: string, status: Lead["status"]) => void;
  search: string;
  statusFilter: string;
  showPagination?: boolean;
  emptyMessage?: string;
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

export default function LeadList({
  leads,
  loading,
  total,
  page,
  totalPages,
  onPageChange,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  onStatusChange,
  search,
  statusFilter,
  showPagination = true,
  emptyMessage = "No leads yet. Select a business type and generate your first leads!",
}: LeadListProps) {
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSort = (field: string) => {
    const newOrder = field === sortBy && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(newOrder);
    onSortChange(field, newOrder);
  };

  const sortOptions = [
    { value: "createdAt_desc", label: "Newest First" },
    { value: "createdAt_asc", label: "Oldest First" },
    { value: "score_desc", label: "Highest Score" },
    { value: "score_asc", label: "Lowest Score" },
    { value: "companyName_asc", label: "Company Name A-Z" },
    { value: "companyName_desc", label: "Company Name Z-A" },
    { value: "contactName_asc", label: "Contact Name A-Z" },
    { value: "contactName_desc", label: "Contact Name Z-A" },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or company..."
              className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {/* Status filter */}
          <div className="flex gap-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusFilterChange(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === opt.value
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {/* Sort */}
        <select
          value={`${sortBy}_${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split("_");
            setSortBy(field);
            setSortOrder(order);
            onSortChange(field, order);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500">
        {loading ? "Loading..." : `${total} lead${total === 1 ? "" : "s"} found`}
      </p>

      {/* Lead cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="mb-3 h-4 w-48 rounded bg-gray-200" />
              <div className="mb-2 h-3 w-32 rounded bg-gray-200" />
              <div className="mb-1 h-3 w-40 rounded bg-gray-200" />
              <div className="h-3 w-28 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <svg className="mb-3 h-10 w-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <p className="text-sm font-medium text-gray-900">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    page === pageNum
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}