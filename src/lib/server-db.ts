import { neon } from "@neondatabase/serverless"

let cached: ReturnType<typeof neon> | null = null

export function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not configured")
  if (!cached) cached = neon(url)
  return cached
}

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL)
}
