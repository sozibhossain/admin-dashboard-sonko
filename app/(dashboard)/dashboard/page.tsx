"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRightLeft,
  DollarSign,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getAdminDashboard, type Transaction } from "@/lib/api"

const statusColors = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"]

const displayName = (user?: Transaction["user"]) =>
  user?.name || user?.username || user?.email || user?.phone || "-"

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  })

  const dashboard = data?.data
  const summary = dashboard?.summary
  const latestTransactions = dashboard?.latestTransactions ?? []
  const transactionByType = dashboard?.transactionByType ?? []
  const transactionByStatus = dashboard?.transactionByStatus ?? []
  const totalRevenue = useMemo(
    () => transactionByStatus.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
    [transactionByStatus]
  )

  const stats = [
    { title: "Total Revenue", value: `GMD ${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { title: "Total Transactions", value: `${summary?.totalTransactions ?? 0}`, icon: ArrowRightLeft },
    { title: "Total Agents", value: `${summary?.totalAgents ?? 0}`, icon: UserCheck },
    { title: "Total Users", value: `${summary?.totalUsers ?? 0}`, icon: Users },
  ]

  return (
    <div className="p-8 bg-[#f5f6f8] min-h-screen text-[#2c2c2c]">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[#7a7a7a]">Live backend admin overview</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="h-9 rounded-md bg-[#4d9bff] px-4 text-sm font-semibold text-white"
        >
          Refresh
        </button>
      </div>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load dashboard data.
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-lg border border-[#d7d7d7] p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#7a7a7a]">{stat.title}</div>
                <div className="h-7 w-7 rounded-md bg-[#e9f1ff] flex items-center justify-center text-[#4d9bff]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-lg font-semibold">{isLoading ? "..." : stat.value}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#d7d7d7] p-4">
          <div className="text-sm font-semibold mb-3">Transactions by Type</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionByType.map((item) => ({ name: item._id || "unknown", count: item.count }))}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4d9bff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#d7d7d7] p-4">
          <div className="text-sm font-semibold mb-2">Transaction Status</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={transactionByStatus} dataKey="count" nameKey="_id" innerRadius={52} outerRadius={74}>
                  {transactionByStatus.map((entry, index) => (
                    <Cell key={entry._id || index} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-xs">
            {transactionByStatus.map((entry, index) => (
              <div key={entry._id || index} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors[index % statusColors.length] }} />
                  {entry._id || "unknown"}
                </span>
                <span>{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_2fr] gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#d7d7d7] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-[#4d9bff]" />
            Pending KYC
          </div>
          <div className="mt-4 text-4xl font-semibold">{summary?.pendingKyc ?? 0}</div>
          <p className="mt-2 text-xs text-[#7a7a7a]">Pending or in-review identity checks</p>
        </div>

        <div className="bg-white rounded-lg border border-[#d7d7d7] p-4">
          <div className="text-sm font-semibold mb-4">Active Payment Gateways</div>
          <div className="grid grid-cols-2 gap-3">
            {(dashboard?.gatewaySettings ?? []).map((setting) => (
              <div key={setting.module} className="rounded-lg border border-[#d7d7d7] p-3">
                <div className="text-xs uppercase text-[#7a7a7a]">{setting.module.replaceAll("_", " ")}</div>
                <div className="mt-1 font-semibold">{setting.gateway}</div>
                <div className={`mt-2 text-xs ${setting.enabled ? "text-[#2ea44f]" : "text-[#ff2d2d]"}`}>
                  {setting.enabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#d7d7d7] p-4">
        <div className="text-sm font-semibold">Latest Transactions</div>
        <div className="mt-4 border border-[#bdbdbd] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-white border-b border-[#bdbdbd]">
              <tr className="text-left text-[#2c2c2c]">
                <th className="px-4 py-3 font-semibold">Transaction ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {latestTransactions.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[#7a7a7a]" colSpan={6}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                latestTransactions.map((row) => (
                  <tr key={row._id} className="border-b border-[#bdbdbd] last:border-b-0">
                    <td className="px-4 py-3">{row._id}</td>
                    <td className="px-4 py-3">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td>
                    <td className="px-4 py-3">{displayName(row.user)}</td>
                    <td className="px-4 py-3">{row.type ?? "-"}</td>
                    <td className="px-4 py-3">
                      {row.currency ?? "GMD"} {Number(row.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded-full bg-[#e9f1ff] text-[#2563eb] text-[10px] font-semibold">
                        {row.status ?? "pending"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
