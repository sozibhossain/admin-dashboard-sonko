"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Eye, X } from "lucide-react"
import { CustomPagination } from "@/components/custom-pagination"
import { Badge } from "@/components/ui/badge"
import { ViewModal } from "@/components/view-modal"
import { toast } from "sonner"
import { getAdminUsers, updateAgentApplicationStatus, type User } from "@/lib/api"

const displayName = (user: User) =>
  user.agentProfile?.fullName || user.name || user.username || user.email || user.phone || "Agent"

const statusColor = (status?: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function Agents() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [viewAgent, setViewAgent] = useState<User | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-agent-applications", tab],
    queryFn: () =>
      tab === "approved"
        ? getAdminUsers({ role: "agent", limit: 100 })
        : getAdminUsers({ requestedRole: "agent", agentStatus: tab, limit: 100 }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ userId, status, rejectionReason }: { userId: string; status: "approved" | "rejected"; rejectionReason?: string }) =>
      updateAgentApplicationStatus(userId, { status, rejectionReason }),
    onSuccess: () => {
      toast.success("Agent application updated")
      queryClient.invalidateQueries({ queryKey: ["admin-agent-applications"] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
    onError: () => toast.error("Unable to update agent application"),
  })

  const agents = data?.data.users ?? []
  const filteredData = useMemo(
    () =>
      agents.filter((agent) =>
        `${displayName(agent)} ${agent.phone ?? ""} ${agent.agentProfile?.businessName ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [agents, search]
  )
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalBalance = agents.reduce((sum, item) => sum + Number(item.cash ?? 0), 0)

  const reject = (userId: string) => {
    const reason = window.prompt("Rejection reason", "Agent application rejected")
    if (reason == null) return
    statusMutation.mutate({ userId, status: "rejected", rejectionReason: reason })
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
        <p className="text-gray-500 text-sm">Review agent applications and manage approved agents</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">Current List</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{agents.length}</div><p className="text-xs text-gray-500 mt-1">{tab} agents</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">Visible</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{paginatedData.length}</div><p className="text-xs text-gray-500 mt-1">After filtering</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">Wallet Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">GMD {totalBalance.toLocaleString()}</div><p className="text-xs text-gray-500 mt-1">Combined wallet</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900 capitalize">{tab}</div><p className="text-xs text-gray-500 mt-1">Selected tab</p></CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "rejected"] as const).map((item) => (
              <Button key={item} variant={tab === item ? "default" : "outline"} onClick={() => { setTab(item); setCurrentPage(1) }}>
                {item[0].toUpperCase() + item.slice(1)}
              </Button>
            ))}
            <Input placeholder="Name, phone or business" value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
            <Button variant="outline" onClick={() => setSearch("")}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Applicant</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Business</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">National ID</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-6 py-6 text-gray-500" colSpan={6}>Loading agents...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td className="px-6 py-6 text-gray-500" colSpan={6}>No agent records found.</td></tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3"><div className="font-medium text-gray-900">{displayName(item)}</div><div className="text-xs text-gray-500">{item.email ?? "-"}</div></td>
                    <td className="px-6 py-3 text-gray-900">{item.agentProfile?.businessName ?? "-"}</td>
                    <td className="px-6 py-3 text-gray-900">{item.phone ?? "-"}</td>
                    <td className="px-6 py-3 text-gray-900">{item.agentProfile?.nationalId ?? "-"}</td>
                    <td className="px-6 py-3"><Badge className={statusColor(item.agentStatus)}>{item.agentStatus ?? item.role}</Badge></td>
                    <td className="px-6 py-3 flex gap-2">
                      <Eye className="h-4 w-4 text-blue-500 cursor-pointer hover:text-blue-700" onClick={() => setViewAgent(item)} />
                      {item.agentStatus === "pending" ? (
                        <>
                          <Check className="h-4 w-4 text-green-500 cursor-pointer hover:text-green-700" onClick={() => statusMutation.mutate({ userId: item._id, status: "approved" })} />
                          <X className="h-4 w-4 text-red-500 cursor-pointer hover:text-red-700" onClick={() => reject(item._id)} />
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <ViewModal
        open={!!viewAgent}
        title="Agent Application"
        description={viewAgent ? displayName(viewAgent) : undefined}
        onClose={() => setViewAgent(null)}
        fields={[
          { label: "User ID", value: viewAgent?._id ?? "-" },
          { label: "Full Name", value: viewAgent ? displayName(viewAgent) : "-" },
          { label: "Business Name", value: viewAgent?.agentProfile?.businessName ?? "-" },
          { label: "Business Address", value: viewAgent?.agentProfile?.businessAddress ?? "-" },
          { label: "National ID", value: viewAgent?.agentProfile?.nationalId ?? "-" },
          { label: "Country", value: viewAgent?.agentProfile?.country ?? "-" },
          { label: "City", value: viewAgent?.agentProfile?.city ?? "-" },
          { label: "Phone", value: viewAgent?.phone ?? "-" },
          { label: "Email", value: viewAgent?.email ?? "-" },
          { label: "Status", value: viewAgent?.agentStatus ?? "-" },
          { label: "Rejection Reason", value: viewAgent?.agentProfile?.rejectionReason ?? "-" },
        ]}
      />
    </div>
  )
}
