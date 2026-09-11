import Link from "next/link"

const rows = [
  {
    channel: "爱吾",
    qq: "爱吾，广州熊动，合作群",
    contact: "爱吾仓鼠",
    qqStatus: "已发送",
    backendStatus: "提测通过 / 待上架",
    packageStatus: "正式包需爱吾签名",
    overall: "处理中",
  },
  { channel: "BTGO", qq: "待录入", contact: "待录入", qqStatus: "待配置", backendStatus: "待确认", packageStatus: "待确认", overall: "待录入" },
  { channel: "3011", qq: "待录入", contact: "待录入", qqStatus: "待配置", backendStatus: "待确认", packageStatus: "待确认", overall: "待录入" },
  { channel: "百分网", qq: "待录入", contact: "待录入", qqStatus: "待配置", backendStatus: "待确认", packageStatus: "待确认", overall: "待录入" },
  { channel: "九一玩", qq: "待录入", contact: "待录入", qqStatus: "待配置", backendStatus: "待确认", packageStatus: "待确认", overall: "待录入" },
]

export default function ReleasesPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-emerald-700">← 返回工作台</Link>
            <h1 className="mt-3 text-3xl font-bold">云上征途（3折三国争霸）</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">首发 2026-09-16 10:00</span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">3折 · 渠道设置</span>
            </div>
          </div>
          <button className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white opacity-50" disabled>
            一键发布（下一阶段）
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["渠道总数", "约 20"],
            ["已录入规则", "1"],
            ["QQ已发送", "1"],
            ["后台完成", "0"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-3xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">渠道执行清单</h2>
              <p className="mt-1 text-sm text-slate-400">以后每个首发都由系统自动生成这一张表。</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="px-4 py-3 font-semibold">渠道</th>
                  <th className="px-4 py-3 font-semibold">QQ群</th>
                  <th className="px-4 py-3 font-semibold">联系人</th>
                  <th className="px-4 py-3 font-semibold">QQ通知</th>
                  <th className="px-4 py-3 font-semibold">开发者后台</th>
                  <th className="px-4 py-3 font-semibold">包体</th>
                  <th className="px-4 py-3 font-semibold">总状态</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.channel} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-4 font-bold">{row.channel}</td>
                    <td className="px-4 py-4 text-slate-600">{row.qq}</td>
                    <td className="px-4 py-4 text-slate-600">{row.contact}</td>
                    <td className="px-4 py-4"><Status value={row.qqStatus} /></td>
                    <td className="px-4 py-4 text-slate-600">{row.backendStatus}</td>
                    <td className="px-4 py-4 text-slate-600">{row.packageStatus}</td>
                    <td className="px-4 py-4"><Status value={row.overall} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-600">爱吾 SOP</div>
            <h2 className="mt-2 text-xl font-bold">已确认的自动化规则</h2>
            <div className="mt-5 space-y-3 text-sm">
              {[
                ["QQ群", "爱吾，广州熊动，合作群"],
                ["@联系人", "爱吾仓鼠"],
                ["后台", "cp.25game.com/Main.aspx"],
                ["提测状态", "已通过"],
                ["当前上架状态", "待上架"],
                ["正式包", "全部需要爱吾签名"],
                ["资质", "后台备注明确要求上传"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_1fr] gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="text-slate-400">{k}</div>
                  <div className="font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[.18em] text-slate-400">Message template</div>
            <h2 className="mt-2 text-xl font-bold">首发 QQ 模板</h2>
            <pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">{`游戏上线名称：《{游戏上线名称}》\n1、首发时间：{首发时间}\n2、首发物料已同步，麻烦上传预约\n3、该款为{折扣}，折扣由贵方设置！！\n\n包体测试了嘛 @{渠道联系人}`}</pre>
            <p className="mt-3 text-xs leading-5 text-slate-400">后续会根据每个渠道的规则自动生成不同模板，并自动关联 ZIP / APK。</p>
          </div>
        </section>
      </div>
    </main>
  )
}

function Status({ value }: { value: string }) {
  const good = value.includes("已")
  const doing = value.includes("处理") || value.includes("通过")
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${good ? "bg-emerald-50 text-emerald-700" : doing ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
      {value}
    </span>
  )
}
