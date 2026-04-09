"use client"

import { useState } from "react"

export function ChannelForm({ onCreated }: { onCreated: () => void }) {
  const [channel_name, setChannelName] = useState("")
  const [platform, setPlatform] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel_name, platform }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.error) {
      const err = json.error
      setMessage(typeof err === "object" && err && "message" in err ? String(err.message) : String(err))
      return
    }
    setChannelName("")
    setPlatform("")
    setMessage("已创建")
    onCreated()
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 space-y-2 rounded border border-gray-200 p-4">
      <h2 className="font-semibold">新增渠道</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          名称
          <input
            className="rounded border px-2 py-1"
            value={channel_name}
            onChange={(e) => setChannelName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          平台
          <input
            className="rounded border px-2 py-1"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? "提交中…" : "创建"}
        </button>
      </div>
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
    </form>
  )
}
