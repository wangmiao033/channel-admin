import { hasWorkbenchPassword, sessionCookie, verifyPassword, verifySession } from "@/lib/server-auth"

export async function GET(request: Request) {
  if (!hasWorkbenchPassword()) {
    return Response.json({ configured: false, authenticated: false }, { status: 503 })
  }
  return Response.json({ configured: true, authenticated: verifySession(request) })
}

export async function POST(request: Request) {
  if (!hasWorkbenchPassword()) {
    return Response.json({ error: "WORKBENCH_PASSWORD is not configured" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({})) as { password?: string }
  if (!verifyPassword(body.password || "")) {
    return Response.json({ error: "密码错误" }, { status: 401 })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": sessionCookie(),
    },
  })
}
