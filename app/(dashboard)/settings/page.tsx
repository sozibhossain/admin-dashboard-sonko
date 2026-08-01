"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

const settingsItems = [
  { label: "Add Employee", href: "/settings/add-employee" },
  { label: "Access Permissions", href: "/settings/access-permissions" },
  { label: "Personal Information", href: "/settings/personal-information" },
  { label: "Change Password", href: "/settings/change-password" },
  { label: "Payment Gateways", href: "/payment-gateways" },
]

export default function Settings() {
  return (
    <div className="p-8 bg-[#f5f6f8] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#2c2c2c]">Settings</h1>
        <p className="text-sm text-[#7a7a7a]">Dashboard &gt; Settings</p>
      </div>

      <div className="space-y-4 max-w-5xl">
        {settingsItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between bg-white border border-[#bdbdbd] rounded-xl px-6 py-4 text-[#2c2c2c]"
          >
            <span className="text-lg font-semibold">{item.label}</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
