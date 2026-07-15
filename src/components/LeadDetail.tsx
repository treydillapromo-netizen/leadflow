import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Lead } from "~/lib/mock-data";
import StatusBadge from "./StatusBadge";
import ScoreBadge from "./ScoreBadge";

interface LeadDetailProps {
  lead: Lead;
  onStatusChange: (id: string, status: Lead["status"]) => void;
  onNotesChange: (id: string, notes: string) => void;
}

export default function LeadDetail({ lead, onStatusChange, onNotesChange }: LeadDetailProps) {
  const [notes, setNotes] = useState(lead.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSaveNotes = () => {
    setSaving(true);
    onNotesChange(lead.id, notes);
    setTimeout(() => setSaving(false), 500);
  };

  const statusActions: { status: Lead["status"]; label: string; color: string }[] = [
    { status: "contacted", label: "Mark Contacted", color: "bg-amber-600 hover:bg-amber-500" },
    { status: "qualified", label: "Mark Qualified", color: "bg-purple-600 hover:bg-purple-500" },
    { status: "converted", label: "Mark Converted", color: "bg-emerald-600 hover:bg-emerald-500" },
    { status: "lost", label: "Mark Lost", color: "bg-red-600 hover:bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/leads"
        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to all leads
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{lead.companyName}</h1>
              <ScoreBadge score={lead.score} />
              <StatusBadge status={lead.status} />
            </div>
            <p className="mt-1 text-lg text-gray-600">{lead.contactName}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Email</p>
              <a href={`mailto:${lead.email}`} className="text-sm text-indigo-600 hover:text-indigo-500">
                {lead.email}
              </a>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{lead.phone}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Business Type</p>
              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                {lead.businessType}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Source</p>
              <p className="text-sm text-gray-900">{lead.source || "Unknown"}</p>
            </div>
          </div>
        </div>

        {/* Website & Address */}
        {(lead.website || lead.address) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {lead.website && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Website</p>
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-500">
                  {lead.website}
                </a>
              </div>
            )}
            {lead.address && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Address</p>
                <p className="text-sm text-gray-900">{lead.address}</p>
              </div>
            )}
          </div>
        )}

        {/* Created */}
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Created</p>
          <p className="text-sm text-gray-900">{new Date(lead.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</p>
        </div>
      </div>

      {/* Status Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Update Status</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {statusActions
            .filter((a) => a.status !== lead.status)
            .map((action) => (
              <button
                key={action.status}
                onClick={() => onStatusChange(lead.id, action.status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-all ${action.color}`}
              >
                {action.label}
              </button>
            ))}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this lead..."
          rows={4}
          className="mt-3 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>
    </div>
  );
}