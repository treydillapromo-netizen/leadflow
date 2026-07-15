import { useState, useEffect } from "react";
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import Header from "~/components/Header";
import LeadDetail from "~/components/LeadDetail";
import { fetchLead, updateLead, type Lead } from "~/lib/api";

export const Route = createFileRoute("/leads/$id")({
  component: LeadDetailPage,
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-gray-500">Lead not found</p>
    </div>
  ),
});

function LeadDetailPage() {
  const { id } = useParams({ from: "/leads/$id" });
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchLead(id)
      .then((data) => {
        setLead(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Lead not found");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleStatusChange = async (leadId: string, status: Lead["status"]) => {
    try {
      const updated = await updateLead(leadId, { status });
      setLead(updated);
    } catch (err) {
      console.error("Failed to update lead:", err);
    }
  };

  const handleNotesChange = async (leadId: string, notes: string) => {
    try {
      const updated = await updateLead(leadId, { notes });
      setLead(updated);
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 h-6 w-48 rounded bg-gray-200" />
              <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
              <div className="h-4 w-40 rounded bg-gray-200" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-dvh bg-gray-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-medium text-gray-900">{error || "Lead not found"}</p>
            <button
              onClick={() => navigate({ to: "/leads" })}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Back to Leads
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <LeadDetail
          lead={lead}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
        />
      </main>
    </div>
  );
}