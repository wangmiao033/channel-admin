import Link from "next/link"

type ChannelRow = {
  id: string
  channel_code: string | null
  channel_name: string | null
  platform: string | null
  discount_rate: number | null
}

export function ChannelTable({ data }: { data: ChannelRow[] }) {
  return (
    <table className="w-full border border-collapse text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">渠道ID</th>
          <th className="border p-2 text-left">名称</th>
          <th className="border p-2 text-left">平台</th>
          <th className="border p-2 text-left">折扣</th>
          <th className="border p-2 text-left">详情</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={5} className="border p-4 text-center text-gray-500">
              暂无数据
            </td>
          </tr>
        ) : (
          data.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.channel_code}</td>
              <td className="border p-2">{c.channel_name}</td>
              <td className="border p-2">{c.platform}</td>
              <td className="border p-2">{c.discount_rate}</td>
              <td className="border p-2">
                <Link href={`/channels/${c.id}`} className="text-blue-600 underline">
                  查看
                </Link>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
