import { Link } from "@tanstack/react-router";
import type { Lead } from "~/lib/mock-data";
import ScoreBadge from "./ScoreBadge";
import StatusBadge from "./StatusBadge";

interface LeadCardProps {
  lead: Lead;
  onStatusChange?: (id: string, status: Lead["status"]) => void;
}

export default function LeadCard({ lead, onStatusChange }: LeadCardProps) {
  const handleMarkContacted = () => {
    if (lead.status === "new" && onStatusChange) {
      onStatusChange(lead.id, "contacted");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {lead.companyName}
            </h3>
            <ScoreBadge score={lead.score} />
          </div>
          <p className="mt-1 text-sm text-gray-600">{lead.contactName}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
          <span>{lead.phone}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
          {lead.businessType}
        </span>
        <div className="flex items-center gap-2">
          {lead.status === "new" && onStatusChange && (
            <button
              onClick={handleMarkContacted}
              className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              Mark Contacted
            </button>
          )}
          <Link
            to="/leads/$id"
            params={{ id: lead.id }}
            className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}