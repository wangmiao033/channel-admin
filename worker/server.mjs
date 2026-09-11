import http from "node:http"
import { chromium } from "playwright"

const PORT = Number(process.env.PORT || 10000)
const BASE_URL = "https://cp.25game.com/Main.aspx"
const USERNAME = process.env.AIWU_USERNAME || ""
const PASSWORD = process.env.AIWU_PASSWORD || ""
const AUTOMATION_TOKEN = process.env.AUTOMATION_TOKEN || ""

let browserPromise = null

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  })
  res.end(JSON.stringify(body))
}

function authorized(req) {
  if (!AUTOMATION_TOKEN) return false
  return req.headers.authorization === `Bearer ${AUTOMATION_TOKEN}`
}

async function readBody(req) {
  let raw = ""
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 1024 * 1024) throw new Error("request too large")
  }
  if (!raw) return {}
  return JSON.parse(raw)
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    })
  }
  return browserPromise
}

async function withPage(fn) {
  if (!USERNAME || !PASSWORD) throw new Error("AIWU_USERNAME / AIWU_PASSWORD are not configured")
  const browser = await getBrowser()
  const context = await browser.newContext({
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    viewport: { width: 1440, height: 1000 },
  })
  const page = await context.newPage()
  page.setDefaultTimeout(12_000)
  try {
    return await fn(page)
  } finally {
    await context.close().catch(() => undefined)
  }
}

function scopes(page) {
  return [page, ...page.frames().filter((frame) => frame !== page.mainFrame())]
}

async function visibleLocator(scope, selectors) {
  for (const selector of selectors) {
    const locator = scope.locator(selector).first()
    if ((await locator.count().catch(() => 0)) > 0 && await locator.isVisible().catch(() => false)) {
      return locator
    }
  }
  return null
}

async function hasVisibleText(page, text) {
  for (const scope of scopes(page)) {
    const locator = scope.getByText(text, { exact: true }).first()
    if ((await locator.count().catch(() => 0)) > 0 && await locator.isVisible().catch(() => false)) return true
  }
  return false
}

async function loggedIn(page) {
  return (await hasVisibleText(page, "游戏列表")) || (await hasVisibleText(page, "提测列表"))
}

async function login(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 })
  await page.waitForTimeout(800)
  if (await loggedIn(page)) return { ok: true, url: page.url() }

  let userInput = null
  let passInput = null
  let submit = null
  for (const scope of scopes(page)) {
    userInput ||= await visibleLocator(scope, [
      'input[placeholder*="账号"]',
      'input[placeholder*="用户"]',
      'input[name*="user" i]',
      'input[name*="account" i]',
      'input[type="text"]',
    ])
    passInput ||= await visibleLocator(scope, [
      'input[placeholder*="密码"]',
      'input[name*="pass" i]',
      'input[type="password"]',
    ])
    submit ||= await visibleLocator(scope, [
      'button:has-text("登录")',
      'button:has-text("登陆")',
      'input[type="submit"]',
      'input[type="button"][value*="登录"]',
    ])
  }

  if (!userInput || !passInput) {
    throw new Error(`Unable to locate Aiwu login fields at ${page.url()}`)
  }

  await userInput.fill(USERNAME)
  await passInput.fill(PASSWORD)
  if (submit) await submit.click()
  else await passInput.press("Enter")

  await page.waitForTimeout(1800)
  await page.waitForLoadState("domcontentloaded").catch(() => undefined)
  if (!(await loggedIn(page))) {
    const title = await page.title().catch(() => "")
    throw new Error(`Aiwu login failed or UI changed (title=${title})`)
  }
  return { ok: true, url: page.url() }
}

async function clickMenu(page, label) {
  for (const scope of scopes(page)) {
    const locator = scope.getByText(label, { exact: true }).first()
    if ((await locator.count().catch(() => 0)) > 0 && await locator.isVisible().catch(() => false)) {
      await locator.click()
      await page.waitForTimeout(700)
      return true
    }
  }
  return false
}

async function fillSearch(page, value, kind) {
  const selectors = kind === "game"
    ? ['input[placeholder*="游戏名称"]', 'input[placeholder*="游戏"]']
    : ['input[placeholder*="搜索关键词"]', 'input[placeholder*="关键词"]', 'input[placeholder*="游戏"]']

  for (const scope of scopes(page)) {
    const input = await visibleLocator(scope, selectors)
    if (!input) continue
    await input.fill(value)
    await input.press("Enter").catch(() => undefined)
    await page.waitForTimeout(700)
    return true
  }
  return false
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

async function readMatchingTable(page, needle) {
  const shortNeedle = normalizeText(needle).replace(/[《》()（）]/g, "").slice(0, 8)
  for (const scope of scopes(page)) {
    const tables = scope.locator("table")
    const tableCount = await tables.count().catch(() => 0)
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i)
      const text = normalizeText(await table.innerText().catch(() => ""))
      if (!text || (!text.includes(needle) && !text.includes(shortNeedle))) continue

      const headers = (await table.locator("thead th").allTextContents().catch(() => []))
        .map(normalizeText)
        .filter(Boolean)
      const rows = table.locator("tbody tr")
      const rowCount = await rows.count().catch(() => 0)
      for (let r = 0; r < rowCount; r++) {
        const row = rows.nth(r)
        const rowText = normalizeText(await row.innerText().catch(() => ""))
        if (!rowText.includes(needle) && !rowText.includes(shortNeedle)) continue
        const cells = (await row.locator("td").allTextContents().catch(() => [])).map(normalizeText)
        const record = {}
        headers.forEach((header, index) => {
          if (header) record[header] = cells[index] || ""
        })
        const status = record["状态"] || cells.find((cell) => /待上架|已上架|通过|未通过|审核|测试|处理中/.test(cell)) || ""
        return { headers, row: cells, record, status, rowText }
      }
    }
  }
  return null
}

async function readGameList(page, gameName) {
  if (!(await clickMenu(page, "游戏列表"))) throw new Error("Cannot find 游戏列表 menu")
  await fillSearch(page, gameName, "game")
  const table = await readMatchingTable(page, gameName)
  return {
    url: page.url(),
    ...(table || { headers: [], row: [], record: {}, status: "", rowText: "" }),
  }
}

async function readTestingList(page, gameName) {
  if (!(await clickMenu(page, "提测列表"))) throw new Error("Cannot find 提测列表 menu")
  await fillSearch(page, gameName, "testing")
  const table = await readMatchingTable(page, gameName)
  return {
    url: page.url(),
    ...(table || { headers: [], row: [], record: {}, status: "", rowText: "" }),
  }
}

async function scanCurrent(page, label) {
  const result = { label, url: page.url(), title: await page.title().catch(() => ""), frames: [] }
  for (const scope of scopes(page)) {
    const inputs = await scope.locator("input:visible, textarea:visible, select:visible").evaluateAll((nodes) => nodes.slice(0, 80).map((node) => ({
      tag: node.tagName.toLowerCase(),
      type: node.getAttribute("type") || "",
      name: node.getAttribute("name") || "",
      placeholder: node.getAttribute("placeholder") || "",
      value: node.tagName === "SELECT" ? "" : (node.getAttribute("value") || ""),
    }))).catch(() => [])
    const buttons = (await scope.locator("button:visible, a:visible, input[type=button]:visible, input[type=submit]:visible").allTextContents().catch(() => []))
      .map(normalizeText).filter(Boolean).slice(0, 120)
    result.frames.push({ url: scope.url(), inputs, buttons })
  }
  return result
}

async function statusSync(gameName) {
  return withPage(async (page) => {
    const loginResult = await login(page)
    const gameList = await readGameList(page, gameName)
    const testingList = await readTestingList(page, gameName)
    return {
      ok: true,
      dryRun: true,
      timestamp: new Date().toISOString(),
      login: loginResult,
      gameName,
      gameList,
      testingList,
    }
  })
}

async function readOnlyScan(gameName) {
  return withPage(async (page) => {
    await login(page)
    const pages = []
    for (const label of ["游戏列表", "提测列表", "结算申请", "返利列表", "统计报表"]) {
      if (await clickMenu(page, label)) pages.push(await scanCurrent(page, label))
    }
    if (gameName) {
      await clickMenu(page, "游戏列表")
      await fillSearch(page, gameName, "game")
      pages.push(await scanCurrent(page, `游戏列表:${gameName}`))
    }
    return { ok: true, dryRun: true, timestamp: new Date().toISOString(), scan: pages }
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, {
      ok: true,
      service: "aiwu-release-worker",
      credentialsConfigured: Boolean(USERNAME && PASSWORD),
      tokenConfigured: Boolean(AUTOMATION_TOKEN),
      mode: "read-only",
    })
  }

  if (!authorized(req)) return json(res, 401, { error: "Unauthorized" })
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" })

  try {
    const body = await readBody(req)
    const gameName = normalizeText(body.gameName || "")

    if (req.url === "/v1/aiwu/status") {
      if (!gameName) return json(res, 400, { error: "gameName is required" })
      return json(res, 200, await statusSync(gameName))
    }
    if (req.url === "/v1/aiwu/scan") {
      return json(res, 200, await readOnlyScan(gameName))
    }
    return json(res, 404, { error: "Not found" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation failed"
    console.error("automation error:", message)
    return json(res, 500, { error: message, dryRun: true })
  }
})

server.listen(PORT, "0.0.0.0", () => {
  console.log(`aiwu-release-worker listening on :${PORT} (read-only mode)`)
})

async function shutdown() {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null)
    if (browser) await browser.close().catch(() => undefined)
  }
  server.close(() => process.exit(0))
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
