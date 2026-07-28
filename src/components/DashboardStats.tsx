import type { DashboardStats } from "~/lib/mock-data";

interface DashboardStatsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function DashboardStats({ stats, loading }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-2 h-3 w-20 rounded bg-gray-200" />
            <div className="h-7 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "Total Leads", value: stats.totalLeads, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Leads Today", value: stats.leadsToday, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Leads This Week", value: stats.leadsThisWeek, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Conversion Rate", value: `${stats.conversionRate}%`, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{card.label}</p>
          <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}