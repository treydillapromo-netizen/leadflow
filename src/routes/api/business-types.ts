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
 * GET /api/business-types
 * List all active business types.
 */
export async function GET() {
  await ensureMigrated();

  const s = sql();
  const rows = await s`
    select * from business_types
    where is_active = true
    order by name asc
  `;

  return json(
    (rows as Record<string, unknown>[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      is_active: row.is_active,
    })),
  );
}
