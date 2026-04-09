import { createClient } from "@supabase/supabase-js"

function resolveSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!raw) return "https://placeholder.supabase.co"
  try {
    const u = new URL(raw)
    if (u.protocol === "http:" || u.protocol === "https:") return raw
  } catch {
    /* invalid URL */
  }
  return "https://placeholder.supabase.co"
}

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"

export const supabase = createClient(resolveSupabaseUrl(), anonKey)
