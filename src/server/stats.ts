import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

export interface LeadStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byStatus: Record<string, number>;
  byBusinessType: Record<string, number>;
  averageScore: number;
}

export const getStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const s = sql();

    const [totalRow] = await s`select count(*)::int as count from leads`;
    const total = (totalRow as { count: number }).count;

    const [todayRow] = await s`
      select count(*)::int as count from leads
      where created_at >= current_date
    `;
    const today = (todayRow as { count: number }).count;

    const [weekRow] = await s`
      select count(*)::int as count from leads
      where created_at >= date_trunc('week', current_date)
    `;
    const thisWeek = (weekRow as { count: number }).count;

    const [monthRow] = await s`
      select count(*)::int as count from leads
      where created_at >= date_trunc('month', current_date)
    `;
    const thisMonth = (monthRow as { count: number }).count;

    const statusRows = await s`
      select status, count(*)::int as count
      from leads
      group by status
    `;
    const byStatus: Record<string, number> = {};
    for (const row of statusRows as { status: string; count: number }[]) {
      byStatus[row.status] = row.count;
    }

    const btRows = await s`
      select business_type, count(*)::int as count
      from leads
      group by business_type
      order by count desc
      limit 10
    `;
    const byBusinessType: Record<string, number> = {};
    for (const row of btRows as { business_type: string; count: number }[]) {
      byBusinessType[row.business_type] = row.count;
    }

    const [scoreRow] = await s`
      select coalesce(round(avg(score), 1), 0) as avg_score
      from leads
    `;
    const averageScore = (scoreRow as { avg_score: number }).avg_score;

    return {
      total,
      today,
      thisWeek,
      thisMonth,
      byStatus,
      byBusinessType,
      averageScore,
    } satisfies LeadStats;
  });
