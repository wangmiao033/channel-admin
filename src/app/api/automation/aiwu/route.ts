import { getSql, hasDatabaseConfig } from "@/lib/server-db"
import { hasWorkbenchPassword, verifySession } from "@/lib/server-auth"

function configured() {
  return Boolean(process.env.AIWU_WORKER_URL && process.env.AIWU_WORKER_TOKEN)
}

function runId() {
  return `aiwu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function GET(request: Request) {
  if (!hasWorkbenchPassword() || !verifySession(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  return Response.json({
    configured: configured(),
    databaseConfigured: hasDatabaseConfig(),
    workerConfigured: Boolean(process.env.AIWU_WORKER_URL),
  })
}

export async function POST(request: Request) {
  if (!hasWorkbenchPassword() || !verifySession(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!configured()) {
    return Response.json({ error: "AIWU worker is not configured", code: "WORKER_NOT_CONFIGURED" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({})) as {
    action?: "status" | "scan"
    gameName?: string
    releaseId?: string
  }
  const action = body.action === "scan" ? "scan" : "status"
  const gameName = (body.gameName || "").trim()
  if (action === "status" && !gameName) {
    return Response.json({ error: "gameName is required" }, { status: 400 })
  }

  const id = runId()
  const input = { action, gameName, releaseId: body.releaseId || "" }
  const sql = hasDatabaseConfig() ? getSql() : null

  if (sql) {
    await sql`
      INSERT INTO automation_runs (id, channel_id, release_id, action, status, dry_run, input)
      VALUES (${id}, 'aiwu', ${body.releaseId || ""}, ${action}, 'running', true, ${JSON.stringify(input)}::jsonb)
    `.catch(() => undefined)
  }

  try {
    const base = process.env.AIWU_WORKER_URL!.replace(/\/$/, "")
    const endpoint = action === "scan" ? "/v1/aiwu/scan" : "/v1/aiwu/status"
    const response = await fetch(`${base}${endpoint}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.AIWU_WORKER_TOKEN}`,
      },
      body: JSON.stringify({ gameName }),
      signal: AbortSignal.timeout(90_000),
    })
    const text = await response.text()
    let output: unknown = { raw: text.slice(0, 5000) }
    try { output = JSON.parse(text) } catch { /* keep redacted/raw prefix */ }

    if (!response.ok) {
      const error = `Worker returned ${response.status}`
      if (sql) {
        await sql`UPDATE automation_runs SET status = 'failed', output = ${JSON.stringify(output)}::jsonb, error = ${error}, updated_at = now() WHERE id = ${id}`.catch(() => undefined)
      }
      return Response.json({ runId: id, error, output }, { status: 502 })
    }

    if (sql) {
      await sql`UPDATE automation_runs SET status = 'succeeded', output = ${JSON.stringify(output)}::jsonb, updated_at = now() WHERE id = ${id}`.catch(() => undefined)
    }
    return Response.json({ runId: id, output })
  } catch (error) {
    const message = error instanceof Error ? error.message : "automation failed"
    if (sql) {
      await sql`UPDATE automation_runs SET status = 'failed', error = ${message}, updated_at = now() WHERE id = ${id}`.catch(() => undefined)
    }
    return Response.json({ runId: id, error: message }, { status: 502 })
  }
}
