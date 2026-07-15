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
 * GET /api/leads/:id
 */
export async function GET({ params }: { params: { id: string } }) {
  await ensureMigrated();
  const s = sql();
  const rows = await s("select * from leads where id = $1", [params.id]) as Record<string, unknown>[];
  if (rows.length === 0) {
    return json({ error: "Lead not found" }, { status: 404 });
  }
  return json(serializeLead(rows[0]));
}

/**
 * PATCH /api/leads/:id
 */
export async function PATCH({ params, request }: { params: { id: string }; request: Request }) {
  await ensureMigrated();
  const body = await request.json() as Record<string, unknown>;
  const allowedFields = ["status", "notes", "score", "contact_name", "email", "phone", "company_name", "business_type"];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return json({ error: "At least one updatable field is required" }, { status: 400 });
  }
  if (updates.status && !["new", "contacted", "qualified", "converted", "lost"].includes(updates.status as string)) {
    return json({ error: "Invalid status" }, { status: 400 });
  }

  const s = sql();
  const setClauses: string[] = [];
  const paramsArr: unknown[] = [params.id];
  for (const [key, value] of Object.entries(updates)) {
    paramsArr.push(value);
    setClauses.push(key + " = $" + paramsArr.length);
  }
  setClauses.push("updated_at = now()");
  const updateSQL = "update leads set " + setClauses.join(", ") + " where id = $1 returning *";
  const rows = await (s as any).query(updateSQL, paramsArr);
  if (rows.length === 0) {
    return json({ error: "Lead not found" }, { status: 404 });
  }
  return json(serializeLead(rows[0]));
}

/**
 * DELETE /api/leads/:id
 */
export async function DELETE({ params }: { params: { id: string } }) {
  await ensureMigrated();
  const s = sql();
  const rows = await s("delete from leads where id = $1 returning id", [params.id]) as Record<string, unknown>[];
  if (rows.length === 0) {
    return json({ error: "Lead not found" }, { status: 404 });
  }
  return json({ deleted: true });
}

function serializeLead(row: Record<string, unknown>) {
  return {
    id: row.id,
    business_type: row.business_type,
    company_name: row.company_name,
    contact_name: row.contact_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    source: row.source,
    status: row.status,
    score: row.score,
    notes: row.notes ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}
