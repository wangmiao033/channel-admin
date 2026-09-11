import { createHmac, timingSafeEqual } from "node:crypto"

const COOKIE_NAME = "xd_workbench_session"

function password() {
  return process.env.WORKBENCH_PASSWORD || ""
}

function tokenForPassword(value: string) {
  return createHmac("sha256", value).update("xiongdong-release-workbench-v1").digest("hex")
}

export function hasWorkbenchPassword() {
  return Boolean(password())
}

export function verifyPassword(candidate: string) {
  const expected = password()
  if (!expected || !candidate) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function verifySession(request: Request) {
  const expectedPassword = password()
  if (!expectedPassword) return false
  const cookie = request.headers.get("cookie") || ""
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  if (!match) return false
  const got = Buffer.from(decodeURIComponent(match[1]))
  const expected = Buffer.from(tokenForPassword(expectedPassword))
  if (got.length !== expected.length) return false
  return timingSafeEqual(got, expected)
}

export function sessionCookie() {
  const value = tokenForPassword(password())
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`
}
