export type ChannelRule = {
  id: string
  name: string
  qqGroup: string
  contact: string
  backendUrl: string
  discountOwner: "渠道" | "我方" | "待确认"
  requiresBackend: boolean
  requiresSign: boolean
  requiresQualification: boolean
  enabled: boolean
  qqTemplate: string
  notes: string
}

export type ChannelTask = {
  channelId: string
  qqStatus: "待发送" | "已发送"
  backendStatus: "不需要" | "待处理" | "处理中" | "已完成"
  signStatus: "不需要" | "待签名" | "已签名"
  qualificationStatus: "不需要" | "待上传" | "已上传"
  testStatus: "待确认" | "测试中" | "已通过"
  listingStatus: "待处理" | "待上架" | "已上架"
  note: string
}

export type ReleaseTask = {
  id: string
  gameName: string
  shortName: string
  launchAt: string
  discount: string
  discountOwner: "渠道" | "我方" | "混合"
  iconUrl: string
  materialZipUrl: string
  apkUrl: string
  bannerUrl: string
  fiveImagesUrl: string
  channelIds: string[]
  tasks: ChannelTask[]
  createdAt: string
  updatedAt: string
}

export type WorkbenchData = {
  version: 1
  channels: ChannelRule[]
  releases: ReleaseTask[]
}

export const STORAGE_KEY = "xiongdong-release-workbench-v1"
const STORAGE_UPDATED_KEY = `${STORAGE_KEY}-updated-at`
const CLOUD_RELOAD_KEY = `${STORAGE_KEY}-cloud-reload`
let cloudSyncStarted = false
let saveTimer: number | null = null

export const DEFAULT_QQ_TEMPLATE = `游戏上线名称：《{游戏上线名称}》\n1、首发时间：{首发时间}\n2、首发物料已同步，麻烦上传预约\n3、该款为{折扣}，折扣由贵方设置！！\n\n包体测试了嘛 @{渠道联系人}`

const seedChannel: ChannelRule = {
  id: "aiwu",
  name: "爱吾",
  qqGroup: "爱吾，广州熊动，合作群",
  contact: "爱吾仓鼠",
  backendUrl: "https://cp.25game.com/Main.aspx",
  discountOwner: "渠道",
  requiresBackend: true,
  requiresSign: true,
  requiresQualification: true,
  enabled: true,
  qqTemplate: DEFAULT_QQ_TEMPLATE,
  notes: "提测需通过；资质需上传；所有正式包需爱吾签名。",
}

const seedRelease: ReleaseTask = {
  id: "release-yunshang-20260916",
  gameName: "云上征途（3折三国争霸）",
  shortName: "云上征途",
  launchAt: "2026-09-16T10:00",
  discount: "3折",
  discountOwner: "渠道",
  iconUrl: "",
  materialZipUrl: "",
  apkUrl: "",
  bannerUrl: "",
  fiveImagesUrl: "",
  channelIds: ["aiwu"],
  tasks: [
    {
      channelId: "aiwu",
      qqStatus: "已发送",
      backendStatus: "处理中",
      signStatus: "待签名",
      qualificationStatus: "待上传",
      testStatus: "已通过",
      listingStatus: "待上架",
      note: "提测已通过，等待正式上架。",
    },
  ],
  createdAt: "2026-09-11T10:00:00+08:00",
  updatedAt: "2026-09-11T10:00:00+08:00",
}

export const seedData: WorkbenchData = {
  version: 1,
  channels: [seedChannel],
  releases: [seedRelease],
}

function isValidData(value: unknown): value is WorkbenchData {
  if (!value || typeof value !== "object") return false
  const data = value as Partial<WorkbenchData>
  return data.version === 1 && Array.isArray(data.channels) && Array.isArray(data.releases)
}

function writeLocal(data: WorkbenchData, updatedAt = Date.now()) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.localStorage.setItem(STORAGE_UPDATED_KEY, String(updatedAt))
}

function readLocal(): WorkbenchData {
  if (typeof window === "undefined") return seedData
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    writeLocal(seedData)
    return seedData
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isValidData(parsed)) throw new Error("invalid")
    return parsed
  } catch {
    writeLocal(seedData)
    return seedData
  }
}

async function ensureCloudSession() {
  if (typeof window === "undefined") return false
  try {
    const status = await fetch("/api/workbench/login", { cache: "no-store" })
    if (status.status === 503) return false
    if (status.ok) {
      const json = await status.json() as { authenticated?: boolean }
      if (json.authenticated) return true
    }

    const attempted = window.sessionStorage.getItem(`${STORAGE_KEY}-login-attempted`)
    if (attempted === "cancelled") return false
    const pass = window.prompt("发行工作台已启用云同步，请输入工作台密码：")
    if (!pass) {
      window.sessionStorage.setItem(`${STORAGE_KEY}-login-attempted`, "cancelled")
      return false
    }

    const login = await fetch("/api/workbench/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: pass }),
    })
    if (!login.ok) {
      window.alert("云同步密码错误，当前仍使用本机数据。")
      return false
    }
    window.sessionStorage.removeItem(`${STORAGE_KEY}-login-attempted`)
    return true
  } catch {
    return false
  }
}

async function putCloud(data: WorkbenchData) {
  if (!(await ensureCloudSession())) return false
  try {
    const response = await fetch("/api/workbench", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data }),
    })
    if (!response.ok) return false
    const json = await response.json().catch(() => ({})) as { updatedAt?: string }
    if (json.updatedAt) {
      window.localStorage.setItem(STORAGE_UPDATED_KEY, String(Date.parse(json.updatedAt)))
    }
    return true
  } catch {
    return false
  }
}

async function hydrateFromCloud(local: WorkbenchData) {
  if (typeof window === "undefined") return
  if (!(await ensureCloudSession())) return

  try {
    const response = await fetch("/api/workbench", { cache: "no-store" })
    if (response.status === 404) {
      await putCloud(local)
      return
    }
    if (!response.ok) return

    const json = await response.json() as { data?: unknown; updatedAt?: string }
    if (!isValidData(json.data)) return
    const remote = json.data
    const remoteUpdated = json.updatedAt ? Date.parse(json.updatedAt) : 0
    const localUpdated = Number(window.localStorage.getItem(STORAGE_UPDATED_KEY) || 0)

    if (localUpdated > remoteUpdated + 1500) {
      await putCloud(local)
      return
    }

    if (JSON.stringify(remote) !== JSON.stringify(local)) {
      writeLocal(remote, remoteUpdated || Date.now())
      const reloadStamp = String(remoteUpdated || Date.now())
      if (window.sessionStorage.getItem(CLOUD_RELOAD_KEY) !== reloadStamp) {
        window.sessionStorage.setItem(CLOUD_RELOAD_KEY, reloadStamp)
        window.location.reload()
      }
    }
  } catch {
    // Local mode remains fully usable if cloud sync is temporarily unavailable.
  }
}

function startCloudSync(local: WorkbenchData) {
  if (typeof window === "undefined" || cloudSyncStarted) return
  cloudSyncStarted = true
  window.setTimeout(() => void hydrateFromCloud(local), 50)
  window.addEventListener("focus", () => void hydrateFromCloud(readLocal()))
}

export function loadData(): WorkbenchData {
  const local = readLocal()
  startCloudSync(local)
  return local
}

export function saveData(data: WorkbenchData) {
  if (typeof window === "undefined") return
  writeLocal(data)
  if (saveTimer !== null) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => void putCloud(data), 450)
}

export async function forceCloudSync() {
  if (typeof window === "undefined") return false
  return putCloud(readLocal())
}

export function replaceTokens(template: string, release: ReleaseTask, channel: ChannelRule) {
  const launch = release.launchAt ? release.launchAt.replace("T", " ") : ""
  return template
    .replaceAll("{游戏上线名称}", release.gameName)
    .replaceAll("{游戏简称}", release.shortName)
    .replaceAll("{首发时间}", launch)
    .replaceAll("{折扣}", release.discount)
    .replaceAll("{渠道联系人}", channel.contact || "对接人")
    .replaceAll("{渠道名称}", channel.name)
}

export function createChannelTask(channel: ChannelRule): ChannelTask {
  return {
    channelId: channel.id,
    qqStatus: "待发送",
    backendStatus: channel.requiresBackend ? "待处理" : "不需要",
    signStatus: channel.requiresSign ? "待签名" : "不需要",
    qualificationStatus: channel.requiresQualification ? "待上传" : "不需要",
    testStatus: "待确认",
    listingStatus: "待处理",
    note: "",
  }
}

export function taskProgress(task: ChannelTask) {
  const checks = [
    task.qqStatus === "已发送",
    task.backendStatus === "已完成" || task.backendStatus === "不需要",
    task.signStatus === "已签名" || task.signStatus === "不需要",
    task.qualificationStatus === "已上传" || task.qualificationStatus === "不需要",
    task.testStatus === "已通过",
    task.listingStatus === "已上架",
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function releaseProgress(release: ReleaseTask) {
  if (!release.tasks.length) return 0
  return Math.round(release.tasks.reduce((sum, task) => sum + taskProgress(task), 0) / release.tasks.length)
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
