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

export function loadData(): WorkbenchData {
  if (typeof window === "undefined") return seedData
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    saveData(seedData)
    return seedData
  }
  try {
    const parsed = JSON.parse(raw) as WorkbenchData
    if (!Array.isArray(parsed.channels) || !Array.isArray(parsed.releases)) throw new Error("invalid")
    return parsed
  } catch {
    saveData(seedData)
    return seedData
  }
}

export function saveData(data: WorkbenchData) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
