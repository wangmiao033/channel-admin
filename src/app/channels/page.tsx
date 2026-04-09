"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ChannelForm } from "@/components/channel-form"
import { ChannelTable } from "@/components/channel-table"

type ChannelRow = {
  id: string
  channel_code: string | null
  channel_name: string | null
  platform: string | null
  discount_rate: number | null
}

export default function ChannelsPage() {
  const [data, setData] = useState<ChannelRow[]>([])

  const refresh = useCallback(() => {
    fetch("/api/channels")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) setData(json as ChannelRow[])
        else setData([])
      })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">渠道管理</h1>
      <ChannelForm onCreated={refresh} />
      <ChannelTable data={data} />
      <p className="mt-6">
        <Link href="/" className="text-blue-600 underline">
          返回首页
        </Link>
      </p>
    </div>
  )
}
