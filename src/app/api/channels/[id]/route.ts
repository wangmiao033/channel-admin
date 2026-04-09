import { supabase } from "@/lib/supabase"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const { data, error } = await supabase.from("channels").select("*").eq("id", id).single()
  if (error) return Response.json({ data: null, error }, { status: 404 })
  return Response.json({ data, error: null })
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const body = await req.json()
  const { data, error } = await supabase.from("channels").update(body).eq("id", id).select().single()
  if (error) return Response.json({ data: null, error }, { status: 400 })
  return Response.json({ data, error: null })
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const { error } = await supabase.from("channels").delete().eq("id", id)
  if (error) return Response.json({ error }, { status: 400 })
  return Response.json({ ok: true })
}
