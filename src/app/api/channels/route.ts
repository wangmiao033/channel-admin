import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const { data, error } = await supabase.from("channels").select("*")
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(req: Request) {
  const body = await req.json()

  const { data: rows } = await supabase.from("channels").select("id")

  const code = "C" + String((rows?.length ?? 0) + 1).padStart(6, "0")

  const { data, error } = await supabase
    .from("channels")
    .insert({
      id: uuidv4(),
      channel_code: code,
      channel_name: body.channel_name,
      platform: body.platform,
      discount_rate: 0.05,
    })
    .select()
    .single()

  return Response.json({ data, error })
}
