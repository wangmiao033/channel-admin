"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { loadData, releaseProgress, WorkbenchData } from "@/lib/workbench-store"

const steps = [
  { name: "创建首发任务", desc: "游戏名、首发时间、折扣只录一次", state: "done" },
  { name: "资料完整性检查", desc: "ICON / 五图 / Banner / APK / ZIP", state: "doing" },
  { name: "渠道任务生成", desc: "按渠道规则自动生成文案与附件", state: "done" },
  { name: "QQ群发送", desc: "当前支持生成 / 复制文案并记录发送状态", state: "doing" },
  { name: "厂商后台处理", desc: "逐渠道接入浏览器自动化", state: "todo" },
]

export default function Home() {
  const [data, setData] = useState<WorkbenchData | null>(null)

  useEffect(() => {
    setData(loadData())
    const onFocus = () => setData(loadData())
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  const latest = data?.releases[0] ?? null
  const sent = useMemo(() => data?.releases.reduce((sum, release) => sum + release.tasks.filter((task) => task.qqStatus === "已发送").length, 0) ?? 0, [data])
  const listed = useMemo(() => data?.releases.reduce((sum, release) => sum + release.tasks.filter((task) => task.listingStatus === "已上架").length, 0) ?? 0, [data])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-slate-950 px-7 py-7 text-white shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 text-sm font-medium text-emerald-300">熊动互娱 · Internal</div>
            <h1 className="text-3xl font-bold tracking-tight">游戏发行工作台</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">把“首发资料 → 渠道群 → 开发者后台 → 签名 / 提测 / 上架”收进一个工作流。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/channels" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-bold text-white hover:bg-white/10">渠道规则库</Link>
            <Link href="/releases" className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">创建 / 管理首发 →</Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["首发任务", String(data?.releases.length ?? "—"), latest?.shortName || "暂无任务"],
            ["渠道规则", String(data?.channels.length ?? "—"), `${data?.channels.filter((item) => item.enabled).length ?? 0} 个启用`],
            ["QQ已发送", String(sent), "跨全部首发任务"],
            ["已上架渠道", String(listed), "跨全部首发任务"],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
              <div className="mt-2 text-xs text-slate-400">{note}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {latest ? (
              <>
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-600">Current release</div>
                    <h2 className="mt-2 text-2xl font-bold">{latest.gameName}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1.5">首发：{latest.launchAt.replace("T", " ")}</span><span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">{latest.discount} · {latest.discountOwner}设置</span></div>
                  </div>
                  <Link href="/releases" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">打开任务详情</Link>
                </div>
                <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between text-sm"><span className="font-semibold">整体进度</span><span className="font-bold">{releaseProgress(latest)}%</span></div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${releaseProgress(latest)}%` }} /></div>
                  <div className="mt-3 text-xs text-slate-400">{latest.tasks.length} 个渠道任务 · 状态修改后自动保存</div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center"><h2 className="text-xl font-bold">还没有首发任务</h2><p className="mt-2 text-sm text-slate-400">先录渠道规则，再创建第一个首发。</p><Link href="/releases" className="mt-5 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white">创建首发任务</Link></div>
            )}

            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><b>V1 已可用：</b> 渠道规则、首发任务、自动生成渠道任务、QQ 文案、进度状态、JSON 备份 / 恢复均已落地。</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[.18em] text-slate-400">V1 roadmap</div>
            <h2 className="mt-2 text-xl font-bold">发行流程</h2>
            <div className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <div key={step.name} className="flex gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.state === "done" ? "bg-emerald-500 text-white" : step.state === "doing" ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-400"}`}>{index + 1}</div>
                  <div><div className="text-sm font-semibold">{step.name}</div><div className="mt-1 text-xs leading-5 text-slate-400">{step.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Link href="/releases" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="text-lg font-bold">发行任务</div><p className="mt-2 text-sm leading-6 text-slate-500">创建游戏首发、选择渠道、生成清单、复制文案、更新处理状态。</p></Link>
          <Link href="/channels" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="text-lg font-bold">渠道规则库</div><p className="mt-2 text-sm leading-6 text-slate-500">保存群名、联系人、折扣、后台地址、签名/资质要求和特殊 SOP。</p></Link>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 p-5"><div className="text-lg font-bold text-slate-500">下一阶段</div><p className="mt-2 text-sm leading-6 text-slate-400">接 Cloudflare R2、QQ Bot、以及爱吾 Playwright 自动化。</p></div>
        </section>
      </div>
    </main>
  )
}
