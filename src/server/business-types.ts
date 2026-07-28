import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

export interface BusinessType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export const listBusinessTypes = createServerFn({ method: "GET" })
  .handler(async () => {
    const s = sql();
    const rows = await s`
      select * from business_types
      where is_active = true
      order by name asc
    `;
    return (rows as Record<string, unknown>[]).map(serializeBusinessType);
  });

export const getBusinessType = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { name: string } }) => {
    const s = sql();
    const rows = await s`
      select * from business_types
      where name = ${data.name}
    `;
    if (rows.length === 0) return null;
    return serializeBusinessType(rows[0] as Record<string, unknown>);
  });

function serializeBusinessType(row: Record<string, unknown>): BusinessType {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    is_active: row.is_active as boolean,
  };
}
