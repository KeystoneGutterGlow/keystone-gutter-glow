import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { addDays } from "@/lib/booking/dates";
import { checkDate } from "@/lib/booking/availability";
import type { BookingRules } from "@/content/booking";

/** A real Postgres (compiled to WASM) with every migration applied in order. */
export async function freshDatabase(): Promise<PGlite> {
  const db = new PGlite();
  const dir = join(process.cwd(), "db", "migrations");
  for (const file of readdirSync(dir).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  return db;
}

/** The first date from `today` on that the rules allow. */
export function firstBookable(today: string, rules: BookingRules, skip = 0): string {
  let seen = 0;
  for (let i = rules.minLeadDays; i <= rules.horizonDays; i++) {
    const d = addDays(today, i);
    if (checkDate(d, today, rules).ok && seen++ === skip) return d;
  }
  throw new Error("no bookable date");
}

function parseFilters(params: URLSearchParams) {
  const where: string[] = [];
  const args: unknown[] = [];
  for (const [col, raw] of params) {
    if (["select", "limit", "on_conflict"].includes(col)) continue;
    const dot = raw.indexOf(".");
    const op = raw.slice(0, dot);
    const val = raw.slice(dot + 1);
    if (op === "eq") {
      args.push(val);
      where.push(`${col}::text = $${args.length}`);
    } else if (op === "gte" || op === "lte") {
      args.push(val);
      where.push(`${col} ${op === "gte" ? ">=" : "<="} $${args.length}::date`);
    } else if (op === "in") {
      const list = val.replace(/^\(|\)$/g, "").split(",");
      where.push(`${col} in (${list.map((v) => `'${v}'`).join(",")})`);
    } else if (op === "is" && val === "null") {
      where.push(`${col} is null`);
    } else {
      throw new Error(`filter not handled by the test shim: ${col}=${raw}`);
    }
  }
  return { where: where.length ? `where ${where.join(" and ")}` : "", args };
}

/**
 * Just enough of PostgREST to run the Supabase stores against real migrations, so the adapters'
 * requests are exercised by the actual tables, triggers and functions without any credentials.
 */
export function postgrestShim(db: PGlite): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const headers = new Headers(init?.headers);
    // PostgREST sends a date column as "YYYY-MM-DD". PGlite hands back a JS Date.
    const json = (data: unknown, status = 200) =>
      new Response(
        JSON.stringify(data, (key, value) =>
          (key === "service_date" || key === "delivery_date") && typeof value === "string" ? value.slice(0, 10) : value,
        ),
        { status },
      );

    if (url.pathname === "/rest/v1/rpc/create_booking") {
      const { rows } = await db.query<{ r: unknown }>("select public.create_booking($1::jsonb) as r", [JSON.stringify(body.p)]);
      return json(rows[0]!.r);
    }

    const table = url.pathname.replace("/rest/v1/", "");
    const { where, args } = parseFilters(url.searchParams);

    if (method === "GET") {
      const { rows } = await db.query(`select * from public.${table} ${where}`, args);
      return json(rows);
    }
    if (method === "POST") {
      const cols = Object.keys(body);
      const placeholders = cols.map((c, i) => (c === "lines" ? `$${i + 1}::jsonb` : `$${i + 1}`));
      const values = cols.map((c) => (c === "lines" ? JSON.stringify(body[c]) : body[c]));
      const conflict = url.searchParams.get("on_conflict");
      const { rows } = await db.query(
        `insert into public.${table} (${cols.join(",")}) values (${placeholders.join(",")})
         ${conflict ? `on conflict (${conflict}) do nothing` : ""} returning *`,
        values,
      );
      return json(rows, 201);
    }
    if (method === "PATCH") {
      const cols = Object.keys(body);
      const sets = cols.map((c, i) => `${c} = $${args.length + i + 1}`);
      const { rows } = await db.query(`update public.${table} set ${sets.join(",")} ${where} returning *`, [
        ...args,
        ...cols.map((c) => body[c]),
      ]);
      return headers.get("Prefer")?.includes("return=representation") ? json(rows) : new Response(null, { status: 204 });
    }
    throw new Error(`method not handled by the test shim: ${method}`);
  }) as typeof fetch;
}
