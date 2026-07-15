import { json } from "@tanstack/react-start";
import { sql } from "~/db";
import { migrate } from "~/db/schema";

let migrated = false;
async function ensureMigrated() {
  if (!migrated) {
    await migrate();
    migrated = true;
  }
}

/**
 * GET /api/stats
 * Return aggregate dashboard statistics.
 */
export async function GET() {
  await ensureMigrated();

  const s = sql();

  const [[totalRow], [todayRow], [weekRow], [monthRow], statusRows, btRows, [scoreRow]] =
    await Promise.all([
      s`select count(*)::int as count from leads`,
      s`select count(*)::int as count from leads where created_at >= current_date`,
      s`select count(*)::int as count from leads where created_at >= date_trunc('week', current_date)`,
      s`select count(*)::int as count from leads where created_at >= date_trunc('month', current_date)`,
      s`select status, count(*)::int as count from leads group by status`,
      s`select business_type, count(*)::int as count from leads group by business_type order by count desc limit 10`,
      s`select coalesce(round(avg(score), 1), 0) as avg_score from leads`,
    ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusRows as { status: string; count: number }[]) {
    byStatus[row.status] = row.count;
  }

  const byBusinessType: Record<string, number> = {};
  for (const row of btRows as { business_type: string; count: number }[]) {
    byBusinessType[row.business_type] = row.count;
  }

  return json({
    total: (totalRow as { count: number }).count,
    today: (todayRow as { count: number }).count,
    thisWeek: (weekRow as { count: number }).count,
    thisMonth: (monthRow as { count: number }).count,
    byStatus,
    byBusinessType,
    averageScore: (scoreRow as { avg_score: number }).avg_score,
  });
}
