import { getSql, hasDatabaseConfig } from "@/lib/server-db"
import { hasWorkbenchPassword, verifySession } from "@/lib/server-auth"

function unavailable() {
  return Response.json(
    { error: "Cloud sync is not configured", code: "CLOUD_NOT_CONFIGURED" },
    { status: 503 },
  )
}

function validWorkbenchData(value: unknown) {
  if (!value || typeof value !== "object") return false
  const data = value as { channels?: unknown; releases?: unknown; version?: unknown }
  return Array.isArray(data.channels) && Array.isArray(data.releases) && data.version === 1
}

export async function GET(request: Request) {
  if (!hasDatabaseConfig() || !hasWorkbenchPassword()) return unavailable()
  if (!verifySession(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sql = getSql()
    const rows = await sql`SELECT data, version, updated_at FROM workbench_state WHERE workspace_key = 'default' LIMIT 1`
    if (!rows.length) return Response.json({ code: "EMPTY" }, { status: 404 })
    const row = rows[0] as { data: unknown; version: number; updated_at: string | Date }
    return Response.json({
      data: row.data,
      version: row.version,
      updatedAt: new Date(row.updated_at).toISOString(),
    })
  } catch (error) {
    console.error("workbench GET failed", error instanceof Error ? error.message : "unknown")
    return Response.json({ error: "Cloud read failed" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!hasDatabaseConfig() || !hasWorkbenchPassword()) return unavailable()
  if (!verifySession(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const data = body && typeof body === "object" && "data" in body ? (body as { data: unknown }).data : body
  if (!validWorkbenchData(data)) {
    return Response.json({ error: "Invalid workbench data" }, { status: 400 })
  }

  try {
    const sql = getSql()
    const json = JSON.stringify(data)
    await sql`
      INSERT INTO workbench_state (workspace_key, version, data, updated_at)
      VALUES ('default', 1, ${json}::jsonb, now())
      ON CONFLICT (workspace_key)
      DO UPDATE SET version = EXCLUDED.version, data = EXCLUDED.data, updated_at = now()
    `
    return Response.json({ ok: true, updatedAt: new Date().toISOString() })
  } catch (error) {
    console.error("workbench PUT failed", error instanceof Error ? error.message : "unknown")
    return Response.json({ error: "Cloud save failed" }, { status: 500 })
  }
}
