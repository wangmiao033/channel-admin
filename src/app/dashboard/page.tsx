"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function Dashboard() {
  const [channels, setChannels] = useState(0)

  useEffect(() => {
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => setChannels(Array.isArray(data) ? data.length : 0))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p className="mt-4">渠道总数：{channels}</p>
      <p className="mt-6">
        <Link href="/" className="text-blue-600 underline">
          返回首页
        </Link>
      </p>
    </div>
  )
}
