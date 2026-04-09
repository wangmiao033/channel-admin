"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type ChannelRow = {
  id: string
  channel_code: string | null
  channel_name: string | null
  platform: string | null
  discount_rate: number | null
}

export default function ChannelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [row, setRow] = useState<ChannelRow | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/channels/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setRow(json.data)
      })
  }, [id])

  if (!row) {
    return (
      <div className="p-6">
        <p>加载中…</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">渠道详情</h1>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="font-medium text-gray-500">渠道码</dt>
          <dd>{row.channel_code}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">名称</dt>
          <dd>{row.channel_name}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">平台</dt>
          <dd>{row.platform}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">折扣</dt>
          <dd>{row.discount_rate}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="mt-6 text-blue-600 underline"
        onClick={() => router.push("/channels")}
      >
        返回列表
      </button>
    </div>
  )
}
