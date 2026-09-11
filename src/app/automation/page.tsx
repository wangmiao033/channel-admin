"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { loadData, saveData, WorkbenchData } from "@/lib/workbench-store"

type AiwuOutput = {
  gameList?: { status?: string; record?: Record<string, string>; row?: string[]; url?: string }
  testingList?: { status?: string; record?: Record<string, string>; row?: string[]; url?: string }
  scan?: unknown
  timestamp?: string
}

export default function AutomationPage() {
  const [data, setData] = useState<WorkbenchData | null>(null)
  const [releaseId, setReleaseId] = useState("")
  const [running, setRunning] = useState<"status" | "scan" | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [config, setConfig] = useState<{ configured?: boolean; workerConfigured?: boolean; databaseConfigured?: boolean } | null>(null)

  useEffect(() => {
    const loaded = loadData()
    setData(loaded)
    setReleaseId(loaded.releases[0]?.id || "")
    fetch("/api/automation/aiwu", { cache: "no-store" })
      .then(async (r) => r.ok ? r.json() : null)
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  const release = useMemo(() => data?.releases.find((item) => item.id === releaseId) || null, [data, releaseId])
  const aiwu = useMemo(() => data?.channels.find((item) => item.id === "aiwu" || item.name.includes("爱吾")) || null, [data])

  async function run(action: "status" | "scan") {
    if (!release) return
    setRunning(action)
    setResult(null)
    try {
      const response = await fetch("/api/automation/aiwu", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, gameName: release.gameName, releaseId: release.id }),
      })
      const json = await response.json()
      setResult(json)
      if (!response.ok) return
      if (action === "status") applyStatus(json.output as AiwuOutput)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "请求失败" })
    } finally {
      setRunning(null)
    }
  }

  function applyStatus(output: AiwuOutput) {
    if (!data || !release || !aiwu) return
    const gameStatus = output.gameList?.status || output.gameList?.record?.状态 || ""
    const testingStatus = output.testingList?.status || output.testingList?.record?.状态 || ""
    const next: WorkbenchData = {
      ...data,
      releases: data.releases.map((item) => {
        if (item.id !== release.id) return item
        return {
          ...item,
          updatedAt: new Date().toISOString(),
          tasks: item.tasks.map((task) => {
            if (task.channelId !== aiwu.id) return task
            return {
              ...task,
              backendStatus: gameStatus.includes("已上架") ? "已完成" : gameStatus ? "处理中" : task.backendStatus,
              listingStatus: gameStatus.includes("已上架") ? "已上架" : gameStatus.includes("待上架") ? "待上架" : task.listingStatus,
              testStatus: testingStatus.includes("通过") ? "已通过" : task.testStatus,
              note: `爱吾自动同步：游戏列表=${gameStatus || "未识别"}；提测=${testingStatus || "未识别"}；${new Date().toLocaleString()}`,
            }
          }),
        }
      }),
    }
    saveData(next)
    setData(next)
  }

  if (!data) return <div className="p-10 text-sm text-slate-400">正在加载…</div>

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-emerald-700">← 返回工作台</Link>
          <h1 className="mt-3 text-3xl font-bold">爱吾后台自动化</h1>
          <p className="mt-2 text-sm text-slate-500">第一阶段只做读取与状态同步，不修改爱吾后台数据，先确保稳定。</p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <StatusCard label="云数据库" ok={config?.databaseConfigured} text={config?.databaseConfigured ? "已配置" : "待配置"} />
          <StatusCard label="爱吾 Worker" ok={config?.workerConfigured} text={config?.workerConfigured ? "已接入" : "待接入 Render"} />
          <StatusCard label="自动化链路" ok={config?.configured} text={config?.configured ? "可运行" : "等待环境变量"} />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-600">选择首发任务</span>
              <select className="input" value={releaseId} onChange={(e) => setReleaseId(e.target.value)}>
                {data.releases.map((item) => <option key={item.id} value={item.id}>{item.gameName} · {item.launchAt.replace("T", " ")}</option>)}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button disabled={!release || running !== null} onClick={() => run("status")} className="h-11 rounded-xl bg-emerald-400 px-5 text-sm font-bold text-slate-950 disabled:opacity-40">
                {running === "status" ? "正在登录爱吾…" : "同步爱吾状态"}
              </button>
              <button disabled={!release || running !== null} onClick={() => run("scan")} className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold disabled:opacity-40">
                {running === "scan" ? "正在扫描…" : "只读扫描页面结构"}
              </button>
            </div>
          </div>

          {release && (
            <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm md:grid-cols-3">
              <div><div className="text-xs text-slate-400">游戏</div><div className="mt-1 font-bold">{release.gameName}</div></div>
              <div><div className="text-xs text-slate-400">爱吾后台</div><div className="mt-1 font-medium">{aiwu?.backendUrl || "未配置"}</div></div>
              <div><div className="text-xs text-slate-400">模式</div><div className="mt-1 font-medium text-emerald-700">只读 / Dry-run</div></div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">最近一次执行结果</h2>
          <p className="mt-1 text-sm text-slate-400">同步成功后，会自动把“提测通过 / 待上架 / 已上架”写回发行任务。</p>
          <pre className="mt-5 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-5 text-xs leading-6 text-slate-200">{result ? JSON.stringify(result, null, 2) : "尚未执行。"}</pre>
        </section>

        <div className="mt-6 rounded-2xl bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          当前自动化不会点击“编辑 / 确定 / 添加提测信息”等写操作。等只读同步稳定后，再逐项开放上传资质、提交正式包、首发上架等动作，并且每个写操作都会保留执行记录。
        </div>
      </div>
    </main>
  )
}

function StatusCard({ label, ok, text }: { label: string; ok?: boolean; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm text-slate-500">{label}</div><div className={`mt-2 text-lg font-bold ${ok ? "text-emerald-600" : "text-amber-600"}`}>{text}</div></div>
}
