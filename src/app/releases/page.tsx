"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import {
  ChannelRule,
  ChannelTask,
  createChannelTask,
  loadData,
  releaseProgress,
  replaceTokens,
  saveData,
  uid,
  WorkbenchData,
} from "@/lib/workbench-store"

const emptyRelease = {
  gameName: "",
  shortName: "",
  launchAt: "",
  discount: "3折",
  discountOwner: "渠道" as "渠道" | "我方" | "混合",
  iconUrl: "",
  materialZipUrl: "",
  apkUrl: "",
  bannerUrl: "",
  fiveImagesUrl: "",
}

export default function ReleasesPage() {
  const [data, setData] = useState<WorkbenchData | null>(null)
  const [selectedId, setSelectedId] = useState<string>("")
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyRelease)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loaded = loadData()
    setData(loaded)
    setSelectedId(loaded.releases[0]?.id ?? "")
    setSelectedChannels(loaded.channels.filter((channel) => channel.enabled).map((channel) => channel.id))
  }, [])

  const release = useMemo(
    () => data?.releases.find((item) => item.id === selectedId) ?? data?.releases[0] ?? null,
    [data, selectedId],
  )

  const channelMap = useMemo(() => new Map((data?.channels ?? []).map((channel) => [channel.id, channel])), [data])

  function persist(next: WorkbenchData) {
    setData(next)
    saveData(next)
  }

  function createRelease(event: FormEvent) {
    event.preventDefault()
    if (!data || !form.gameName.trim() || !form.launchAt || selectedChannels.length === 0) return
    const channels = data.channels.filter((channel) => selectedChannels.includes(channel.id))
    const now = new Date().toISOString()
    const nextRelease = {
      id: uid("release"),
      ...form,
      gameName: form.gameName.trim(),
      shortName: form.shortName.trim() || form.gameName.trim(),
      channelIds: selectedChannels,
      tasks: channels.map(createChannelTask),
      createdAt: now,
      updatedAt: now,
    }
    persist({ ...data, releases: [nextRelease, ...data.releases] })
    setSelectedId(nextRelease.id)
    setForm(emptyRelease)
    setCreating(false)
  }

  function updateTask(channelId: string, patch: Partial<ChannelTask>) {
    if (!data || !release) return
    const releases = data.releases.map((item) => {
      if (item.id !== release.id) return item
      return {
        ...item,
        updatedAt: new Date().toISOString(),
        tasks: item.tasks.map((task) => task.channelId === channelId ? { ...task, ...patch } : task),
      }
    })
    persist({ ...data, releases })
  }

  function removeRelease() {
    if (!data || !release) return
    if (!window.confirm(`确认删除首发任务《${release.gameName}》？`)) return
    const releases = data.releases.filter((item) => item.id !== release.id)
    persist({ ...data, releases })
    setSelectedId(releases[0]?.id ?? "")
  }

  function exportBackup() {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `xiongdong-release-workbench-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importBackup(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as WorkbenchData
        if (!Array.isArray(parsed.channels) || !Array.isArray(parsed.releases)) throw new Error("bad file")
        if (!window.confirm("恢复备份会覆盖当前浏览器里的工作台数据，继续吗？")) return
        saveData(parsed)
        setData(parsed)
        setSelectedId(parsed.releases[0]?.id ?? "")
        window.alert("备份恢复成功。")
      } catch {
        window.alert("这个文件不是有效的工作台备份。")
      }
    }
    reader.readAsText(file)
  }

  async function copyMessage(channel: ChannelRule) {
    if (!release) return
    await navigator.clipboard.writeText(replaceTokens(channel.qqTemplate, release, channel))
    window.alert(`已复制 ${channel.name} 的首发文案。`)
  }

  if (!data) return <div className="p-10 text-sm text-slate-400">正在加载工作台…</div>

  const activeChannels = data.channels.filter((channel) => channel.enabled)
  const completed = release?.tasks.filter((task) => task.listingStatus === "已上架").length ?? 0

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-emerald-700">← 返回工作台</Link>
            <h1 className="mt-3 text-3xl font-bold">发行任务</h1>
            <p className="mt-2 text-sm text-slate-500">创建一次首发，系统按渠道规则生成执行清单和 QQ 文案。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])} />
            <button onClick={() => importRef.current?.click()} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50">恢复备份</button>
            <button onClick={exportBackup} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50">备份 JSON</button>
            <button onClick={() => setCreating((value) => !value)} className="h-11 rounded-xl bg-emerald-400 px-5 text-sm font-bold text-slate-950 hover:bg-emerald-300">+ 创建首发任务</button>
          </div>
        </div>

        <div className="mb-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          当前 V1 已可真实创建、修改和保存；数据保存在这台电脑的浏览器中。建议每次重要变更后点一次“备份 JSON”。
        </div>

        {creating && (
          <form onSubmit={createRelease} className="mb-6 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div><div className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-600">New release</div><h2 className="mt-2 text-xl font-bold">创建新游戏首发</h2></div>
              <button type="button" onClick={() => setCreating(false)} className="text-sm font-semibold text-slate-400 hover:text-slate-800">关闭</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="游戏上线名称 *"><input required className="input" value={form.gameName} onChange={(e) => setForm({ ...form, gameName: e.target.value })} placeholder="例如：云上征途（3折三国争霸）" /></Field>
              <Field label="内部简称"><input className="input" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} placeholder="云上征途" /></Field>
              <Field label="首发时间 *"><input required type="datetime-local" className="input" value={form.launchAt} onChange={(e) => setForm({ ...form, launchAt: e.target.value })} /></Field>
              <Field label="折扣"><input className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="3折" /></Field>
              <Field label="折扣设置方"><select className="input" value={form.discountOwner} onChange={(e) => setForm({ ...form, discountOwner: e.target.value as typeof form.discountOwner })}><option>渠道</option><option>我方</option><option>混合</option></select></Field>
              <Field label="素材 ZIP 链接"><input className="input" value={form.materialZipUrl} onChange={(e) => setForm({ ...form, materialZipUrl: e.target.value })} placeholder="R2 / 文件直链" /></Field>
              <Field label="APK 链接"><input className="input" value={form.apkUrl} onChange={(e) => setForm({ ...form, apkUrl: e.target.value })} placeholder="APK 下载地址" /></Field>
              <Field label="ICON 链接"><input className="input" value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="ICON 直链" /></Field>
              <Field label="Banner 链接"><input className="input" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} placeholder="Banner 直链/目录" /></Field>
              <Field label="五图链接"><input className="input" value={form.fiveImagesUrl} onChange={(e) => setForm({ ...form, fiveImagesUrl: e.target.value })} placeholder="五图直链/目录" /></Field>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold text-slate-600">发行渠道 *</div><button type="button" onClick={() => setSelectedChannels(activeChannels.map((channel) => channel.id))} className="text-xs font-semibold text-emerald-700">全选启用渠道</button></div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                {activeChannels.map((channel) => (
                  <label key={channel.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm ${selectedChannels.includes(channel.id) ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                    <input type="checkbox" checked={selectedChannels.includes(channel.id)} onChange={(e) => setSelectedChannels((current) => e.target.checked ? [...current, channel.id] : current.filter((id) => id !== channel.id))} />
                    <span className="font-semibold">{channel.name}</span>
                  </label>
                ))}
              </div>
              {activeChannels.length === 0 && <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">先到“渠道规则库”新增并启用渠道。</div>}
            </div>

            <div className="mt-5 flex justify-end"><button disabled={activeChannels.length === 0} className="h-11 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white disabled:opacity-40">生成发行任务</button></div>
          </form>
        )}

        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <aside className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4"><div className="font-bold">全部首发</div><div className="mt-1 text-xs text-slate-400">{data.releases.length} 个任务</div></div>
            <div className="divide-y divide-slate-100">
              {data.releases.map((item) => (
                <button key={item.id} onClick={() => setSelectedId(item.id)} className={`block w-full px-5 py-4 text-left transition ${release?.id === item.id ? "bg-emerald-50" : "hover:bg-slate-50"}`}>
                  <div className="truncate text-sm font-bold">{item.shortName}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.launchAt.replace("T", " ")}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${releaseProgress(item)}%` }} /></div>
                </button>
              ))}
              {data.releases.length === 0 && <div className="p-5 text-sm text-slate-400">还没有首发任务。</div>}
            </div>
          </aside>

          {release ? (
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-600">Release task</div>
                    <h2 className="mt-2 text-2xl font-bold">{release.gameName}</h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs"><Tag>{release.launchAt.replace("T", " ")}</Tag><Tag>{release.discount} · {release.discountOwner}设置</Tag><Tag>{release.tasks.length} 个渠道</Tag></div>
                  </div>
                  <div className="flex gap-2"><button onClick={removeRelease} className="rounded-xl border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">删除任务</button></div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Metric label="整体进度" value={`${releaseProgress(release)}%`} />
                  <Metric label="渠道总数" value={String(release.tasks.length)} />
                  <Metric label="已上架" value={`${completed}/${release.tasks.length}`} />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <Material label="素材 ZIP" value={release.materialZipUrl} />
                  <Material label="APK" value={release.apkUrl} />
                  <Material label="ICON" value={release.iconUrl} />
                  <Material label="Banner" value={release.bannerUrl} />
                  <Material label="五图" value={release.fiveImagesUrl} />
                </div>
              </section>

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5"><h2 className="text-xl font-bold">渠道执行清单</h2><p className="mt-1 text-sm text-slate-400">状态修改后立即保存，不需要再点保存按钮。</p></div>
                <div className="divide-y divide-slate-100">
                  {release.tasks.map((task) => {
                    const channel = channelMap.get(task.channelId)
                    if (!channel) return null
                    return (
                      <div key={task.channelId} className="p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{channel.name}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{channel.qqGroup || "未填QQ群"}</span></div>
                            <div className="mt-2 text-sm text-slate-500">@ {channel.contact || "未填联系人"} · {channel.backendUrl || "无后台"}</div>
                            {channel.notes && <div className="mt-2 text-xs leading-5 text-amber-700">规则：{channel.notes}</div>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => copyMessage(channel)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold hover:bg-slate-50">复制QQ文案</button>
                            {task.qqStatus !== "已发送" && <button onClick={() => updateTask(channel.id, { qqStatus: "已发送" })} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-600">标记QQ已发</button>}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                          <StatusSelect label="QQ通知" value={task.qqStatus} options={["待发送", "已发送"]} onChange={(value) => updateTask(channel.id, { qqStatus: value as ChannelTask["qqStatus"] })} />
                          <StatusSelect label="开发者后台" value={task.backendStatus} options={["不需要", "待处理", "处理中", "已完成"]} onChange={(value) => updateTask(channel.id, { backendStatus: value as ChannelTask["backendStatus"] })} />
                          <StatusSelect label="签名包" value={task.signStatus} options={["不需要", "待签名", "已签名"]} onChange={(value) => updateTask(channel.id, { signStatus: value as ChannelTask["signStatus"] })} />
                          <StatusSelect label="资质" value={task.qualificationStatus} options={["不需要", "待上传", "已上传"]} onChange={(value) => updateTask(channel.id, { qualificationStatus: value as ChannelTask["qualificationStatus"] })} />
                          <StatusSelect label="包体测试" value={task.testStatus} options={["待确认", "测试中", "已通过"]} onChange={(value) => updateTask(channel.id, { testStatus: value as ChannelTask["testStatus"] })} />
                          <StatusSelect label="上架" value={task.listingStatus} options={["待处理", "待上架", "已上架"]} onChange={(value) => updateTask(channel.id, { listingStatus: value as ChannelTask["listingStatus"] })} />
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-200">{replaceTokens(channel.qqTemplate, release, channel)}</pre>
                          <textarea value={task.note} onChange={(e) => updateTask(channel.id, { note: e.target.value })} className="input min-h-32 resize-y" placeholder="这次首发的临时备注，例如：对方说下午回签名包。" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">点击右上角“创建首发任务”开始。</div>
          )}
        </div>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-600">{label}</span>{children}</label>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div></div>
}

function Material({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 p-3"><div className="text-xs font-semibold text-slate-500">{label}</div>{value ? <a href={value} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs font-semibold text-emerald-700 hover:underline">打开链接</a> : <div className="mt-1 text-xs text-slate-300">未填写</div>}</div>
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{children}</span>
}

function StatusSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const good = value.startsWith("已") || value === "不需要"
  return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-slate-400">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none ${good ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
}
