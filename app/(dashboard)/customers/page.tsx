"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays } from "lucide-react"
import { CustomPagination } from "@/components/custom-pagination"
import { getAdminUsers, type User } from "@/lib/api"

const displayName = (user: User) => user.name || user.username || user.email || user.phone || "User"

export default function Customers() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchName, setSearchName] = useState("")
  const [searchPhone, setSearchPhone] = useState("")
  const [searchDate, setSearchDate] = useState("")
  const [viewUser, setViewUser] = useState<User | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", "customers"],
    queryFn: () => getAdminUsers({ role: "user", limit: 100 }),
  })

  const customers = data?.data.users ?? []
  const filteredData = useMemo(() => {
    return customers.filter((user) => {
      const dateValue = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : ""
      return (
        displayName(user).toLowerCase().includes(searchName.toLowerCase()) &&
        `${user.phone ?? ""}`.toLowerCase().includes(searchPhone.toLowerCase()) &&
        dateValue.includes(searchDate)
      )
    })
  }, [customers, searchName, searchPhone, searchDate])

  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="p-8 bg-[#f5f6f8] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#2c2c2c]">Customers</h1>
        <p className="text-sm text-[#7a7a7a]">Dashboard &gt; Customers</p>
      </div>

      <div className="mb-5">
        <div className="text-sm font-semibold text-[#2c2c2c] mb-3">Search by:</div>
        <div className="flex gap-4">
          <input
            className="h-10 w-52 rounded-md border border-[#bdbdbd] bg-white px-3 text-sm"
            placeholder="Name"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
          />
          <input
            className="h-10 w-52 rounded-md border border-[#bdbdbd] bg-white px-3 text-sm"
            placeholder="Phone number"
            value={searchPhone}
            onChange={(event) => setSearchPhone(event.target.value)}
          />
          <div className="relative w-52">
            <input
              type="date"
              className="h-10 w-full rounded-md border border-[#bdbdbd] bg-white px-3 pr-10 text-sm"
              value={searchDate}
              onChange={(event) => setSearchDate(event.target.value)}
            />
            <CalendarDays className="h-4 w-4 text-[#4d9bff] absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#bdbdbd] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white border-b border-[#bdbdbd]">
            <tr className="text-[#2c2c2c]">
              <th className="px-6 py-4 text-left font-semibold">Customer Name</th>
              <th className="px-6 py-4 text-left font-semibold">Role</th>
              <th className="px-6 py-4 text-left font-semibold">Phone Number</th>
              <th className="px-6 py-4 text-left font-semibold">Registered</th>
              <th className="px-6 py-4 text-left font-semibold">Balance</th>
              <th className="px-6 py-4 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-6 py-6 text-[#7a7a7a]" colSpan={6}>Loading customers...</td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-[#7a7a7a]" colSpan={6}>No customers found.</td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row._id} className="border-b border-[#bdbdbd] last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={row.avatar?.url || "/placeholder-user.jpg"}
                        alt={displayName(row)}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-[#2c2c2c] font-medium">{displayName(row)}</div>
                        <div className="text-xs text-[#7a7a7a]">{row.email ?? "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#2ea44f]">{row.role ?? "user"}</td>
                  <td className="px-6 py-4 text-[#2c2c2c]">{row.phone ?? "-"}</td>
                  <td className="px-6 py-4 text-[#2c2c2c]">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</td>
                  <td className="px-6 py-4 text-[#2c2c2c]">
                    {row.receivingCurrency ?? "GMD"} {Number(row.cash ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      className="h-9 w-28 rounded-full bg-[#4da3ff] text-white text-sm"
                      onClick={() => setViewUser(row)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {viewUser ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewUser(null)}>
          <div className="bg-white w-[720px] rounded-2xl border border-[#bdbdbd] shadow-xl p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-sm font-semibold text-[#2c2c2c]">Customer Profile</div>
                <div className="text-xl font-semibold text-[#2c2c2c]">{displayName(viewUser)}</div>
                <div className="mt-3 text-sm text-[#2c2c2c]">Phone: {viewUser.phone ?? "-"}</div>
                <div className="mt-1 text-sm text-[#2c2c2c]">Email: {viewUser.email ?? "-"}</div>
                <div className="mt-1 text-sm text-[#2c2c2c]">Role: {viewUser.role ?? "user"}</div>
                <div className="mt-1 text-sm text-[#2c2c2c]">
                  Balance: {viewUser.receivingCurrency ?? "GMD"} {Number(viewUser.cash ?? 0).toLocaleString()}
                </div>
              </div>
              <Image
                src={viewUser.avatar?.url || "/placeholder-user.jpg"}
                alt={displayName(viewUser)}
                width={110}
                height={110}
                className="rounded-lg object-cover"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" className="h-9 rounded-md bg-[#4da3ff] px-4 text-white" onClick={() => setViewUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
