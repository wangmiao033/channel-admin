"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  ChannelRule,
  DEFAULT_QQ_TEMPLATE,
  loadData,
  saveData,
  uid,
  WorkbenchData,
} from "@/lib/workbench-store"

const emptyForm: Omit<ChannelRule, "id"> = {
  name: "",
  qqGroup: "",
  contact: "",
  backendUrl: "",
  discountOwner: "渠道",
  requiresBackend: false,
  requiresSign: false,
  requiresQualification: false,
  enabled: true,
  qqTemplate: DEFAULT_QQ_TEMPLATE,
  notes: "",
}

export default function ChannelsPage() {
  const [data, setData] = useState<WorkbenchData | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => setData(loadData()), [])

  const channels = data?.channels ?? []
  const activeCount = useMemo(() => channels.filter((item) => item.enabled).length, [channels])

  function persist(next: WorkbenchData) {
    setData(next)
    saveData(next)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!data || !form.name.trim()) return

    if (editingId) {
      const next = {
        ...data,
        channels: data.channels.map((item) =>
          item.id === editingId ? { ...item, ...form, name: form.name.trim() } : item,
        ),
      }
      persist(next)
    } else {
      const nextChannel: ChannelRule = {
        id: uid("channel"),
        ...form,
        name: form.name.trim(),
      }
      persist({ ...data, channels: [nextChannel, ...data.channels] })
    }

    setEditingId(null)
    setForm(emptyForm)
  }

  function edit(channel: ChannelRule) {
    const { id, ...rest } = channel
    setEditingId(id)
    setForm(rest)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function toggleEnabled(id: string) {
    if (!data) return
    persist({
      ...data,
      channels: data.channels.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    })
  }

  function remove(id: string) {
    if (!data) return
    const used = data.releases.some((release) => release.channelIds.includes(id))
    if (used) {
      window.alert("这个渠道已经被首发任务引用，先不要删除。可以先停用。")
      return
    }
    if (!window.confirm("确认删除这个渠道规则？")) return
    persist({ ...data, channels: data.channels.filter((item) => item.id !== id) })
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-emerald-700">← 返回工作台</Link>
            <h1 className="mt-3 text-3xl font-bold">渠道规则库</h1>
            <p className="mt-2 text-sm text-slate-500">每个渠道只配置一次。新游戏首发时自动复用群、联系人、后台与 SOP。</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
            已录入 <b>{channels.length}</b> 个 · 启用 <b>{activeCount}</b> 个
          </div>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-600">Channel rule</div>
              <h2 className="mt-2 text-xl font-bold">{editingId ? "编辑渠道" : "新增渠道"}</h2>
            </div>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="text-sm font-semibold text-slate-500 hover:text-slate-900">取消编辑</button>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="渠道名称 *">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="例如：爱吾" />
            </Field>
            <Field label="QQ群名称">
              <input value={form.qqGroup} onChange={(e) => setForm({ ...form, qqGroup: e.target.value })} className="input" placeholder="例如：爱吾，广州熊动，合作群" />
            </Field>
            <Field label="QQ群联系人 / @对象">
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="input" placeholder="例如：爱吾仓鼠" />
            </Field>
            <Field label="厂商后台地址">
              <input value={form.backendUrl} onChange={(e) => setForm({ ...form, backendUrl: e.target.value })} className="input" placeholder="https://..." />
            </Field>
            <Field label="折扣设置方">
              <select value={form.discountOwner} onChange={(e) => setForm({ ...form, discountOwner: e.target.value as ChannelRule["discountOwner"] })} className="input">
                <option>渠道</option><option>我方</option><option>待确认</option>
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
              <Check checked={form.requiresBackend} onChange={(value) => setForm({ ...form, requiresBackend: value })}>需要开发者后台</Check>
              <Check checked={form.requiresSign} onChange={(value) => setForm({ ...form, requiresSign: value })}>正式包需要渠道签名</Check>
              <Check checked={form.requiresQualification} onChange={(value) => setForm({ ...form, requiresQualification: value })}>需要上传资质</Check>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Field label="QQ 首发模板">
              <textarea value={form.qqTemplate} onChange={(e) => setForm({ ...form, qqTemplate: e.target.value })} rows={7} className="input resize-y font-mono text-xs leading-6" />
              <div className="mt-2 text-xs text-slate-400">支持：{"{游戏上线名称}"}、{"{游戏简称}"}、{"{首发时间}"}、{"{折扣}"}、{"{渠道联系人}"}、{"{渠道名称}"}</div>
            </Field>
            <Field label="特殊规则 / SOP 备注">
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={7} className="input resize-y" placeholder="例如：提测需通过；所有正式包需爱吾签名。" />
            </Field>
          </div>

          <div className="mt-5 flex justify-end">
            <button className="h-11 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white hover:bg-slate-800">
              {editingId ? "保存修改" : "保存渠道规则"}
            </button>
          </div>
        </form>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-bold">已录入渠道</h2>
            <p className="mt-1 text-sm text-slate-400">后续新建首发任务时，只显示启用渠道。</p>
          </div>
          {channels.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">还没有渠道规则。</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {channels.map((channel) => (
                <div key={channel.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[1.1fr_1.25fr_1.25fr_.8fr] lg:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold">{channel.name}</div>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${channel.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{channel.enabled ? "启用" : "停用"}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">折扣：{channel.discountOwner}设置</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{channel.qqGroup || "未填写QQ群"}</div>
                    <div className="mt-1 text-xs text-slate-400">@ {channel.contact || "未填写联系人"}</div>
                  </div>
                  <div className="text-sm">
                    <div className="truncate text-slate-600">{channel.backendUrl || "无后台地址"}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                      {channel.requiresBackend && <Tag>后台</Tag>}
                      {channel.requiresSign && <Tag>签名</Tag>}
                      {channel.requiresQualification && <Tag>资质</Tag>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button onClick={() => edit(channel)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">编辑</button>
                    <button onClick={() => toggleEnabled(channel.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">{channel.enabled ? "停用" : "启用"}</button>
                    <button onClick={() => remove(channel.id)} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          当前 V1 数据保存在这台电脑的浏览器里；发行任务页提供 JSON 备份 / 恢复。数据库联机版接上后可无缝迁移。
        </div>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-600">{label}</span>{children}</label>
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) {
  return <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" /><span>{children}</span></label>
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{children}</span>
}
