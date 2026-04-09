import Link from "next/link"

export default function Home() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">渠道管理系统</h1>
      <div className="mt-4 space-x-4">
        <Link href="/dashboard" className="text-blue-600 underline">
          Dashboard
        </Link>
        <Link href="/channels" className="text-blue-600 underline">
          渠道管理
        </Link>
      </div>
    </div>
  )
}
