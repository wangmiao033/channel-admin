import Link from "next/link"

const steps = [
  { name: "创建首发任务", desc: "游戏名、首发时间、折扣只录一次", state: "done" },
  { name: "资料完整性检查", desc: "ICON / 五图 / Banner / APK / ZIP", state: "doing" },
  { name: "渠道任务生成", desc: "按渠道规则自动生成文案与附件", state: "todo" },
  { name: "QQ群发送", desc: "后续接 QQ Bot 自动群发与 @ 联系人", state: "todo" },
  { name: "厂商后台处理", desc: "逐渠道接入浏览器自动化", state: "todo" },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-slate-950 px-7 py-7 text-white shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 text-sm font-medium text-emerald-300">熊动互娱 · Internal</div>
            <h1 className="text-3xl font-bold tracking-tight">游戏发行工作台</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              把“首发资料 → 20 个渠道群 → 开发者后台 → 签名 / 提测 / 上架”收进一个工作流。
            </p>
          </div>
          <Link
            href="/releases"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          >
            查看当前首发任务 →
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["当前首发任务", "1", "云上征途"],
            ["已录入渠道规则", "1", "爱吾已完成首轮梳理"],
            ["待录入渠道", "约 19", "继续按截图录入"],
            ["后台自动化", "0 / 1", "爱吾正在拆 SOP"],
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
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-600">Current release</div>
                <h2 className="mt-2 text-2xl font-bold">云上征途（3折三国争霸）</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">首发：2026-09-16 10:00</span>
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">折扣：3折 · 渠道设置</span>
                </div>
              </div>
              <Link href="/releases" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                打开任务详情
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1fr_1.2fr_.8fr] bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                <div>渠道</div><div>当前进度</div><div>状态</div>
              </div>
              <div className="grid grid-cols-[1fr_1.2fr_.8fr] items-center px-4 py-4 text-sm">
                <div>
                  <div className="font-bold">爱吾</div>
                  <div className="mt-1 text-xs text-slate-400">cp.25game.com</div>
                </div>
                <div>
                  <div className="font-medium">提测已通过 → 等待正式上架</div>
                  <div className="mt-1 text-xs text-slate-400">正式包需爱吾签名；资质需上传</div>
                </div>
                <div>
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">处理中</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
              <b>第一阶段目标：</b> 先实现“游戏资料只录一次 + 渠道规则库 + 自动生成渠道任务 + 完成状态追踪”。QQ 自动群发与渠道后台自动化随后接入。
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[.18em] text-slate-400">V1 roadmap</div>
            <h2 className="mt-2 text-xl font-bold">发行流程</h2>
            <div className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <div key={step.name} className="flex gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.state === "done" ? "bg-emerald-500 text-white" : step.state === "doing" ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-400"}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{step.name}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Link href="/releases" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-bold">发行任务</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">按游戏查看所有渠道的 QQ、后台、签名、提测、上架进度。</p>
          </Link>
          <Link href="/channels" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-bold">渠道规则库</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">保存群名、联系人、折扣、后台地址、素材要求和特殊 SOP。</p>
          </Link>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 p-5">
            <div className="text-lg font-bold text-slate-500">素材中心</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">下一步接 Cloudflare R2，自动关联 APK、五图、Banner 和 ZIP 版本。</p>
          </div>
        </section>
      </div>
    </main>
  )
}
