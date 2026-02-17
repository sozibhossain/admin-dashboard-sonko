"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutGrid,
  Wrench,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  Users,
  Ticket,
  ShieldAlert,
  FileText,
  UserRound,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Services", href: "/services", icon: Wrench },
  { name: "Revenue", href: "/revenue", icon: Wallet },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Exchange Rate", href: "/exchange-rate", icon: ArrowRightLeft },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Fraud Detection", href: "/fraud-detection", icon: ShieldAlert },
  { name: "Customers", href: "/customers", icon: UserRound },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Audit Log", href: "/audit-log", icon: ClipboardList },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Setting", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activePath = pathname === "/" ? "/dashboard" : pathname;

  return (
    <div className="flex h-screen bg-[#f5f6f8]">
      <div className="w-64 bg-white border-r border-[#d7d7d7] flex flex-col">
        <div className="h-16 flex items-center justify-center gap-2 px-5 border-b border-[#d7d7d7]">
          <Image
            src="/logo.png"
            alt="Company Logo"
            width={32}
            height={32}
            className=" w-[32px] h-[44px]"
          />
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePath === item.href ||
              activePath.startsWith(item.href + "/");

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md mb-2 transition-colors ${
                    isActive
                      ? "bg-[#4d9bff] text-white"
                      : "text-[#2c2c2c] hover:bg-[#f0f2f5]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#d7d7d7] p-4">
          <button className="flex items-center gap-2 text-[#f08a24] hover:text-[#e8791c] font-medium text-sm w-full px-4 py-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-[#d7d7d7] flex items-center justify-end px-8">
          <div className="flex items-center gap-4">
            <Link href="/notifications">
              <button type="button" className="text-[#ff2d2d]">
                <Bell className="h-5 w-5" />
              </button>
            </Link>
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold text-[#2c2c2c]">
                Alex rock
              </div>
              <div className="text-xs text-[#7a7a7a]">Admin</div>
            </div>
            <Image
              src="/placeholder-user.jpg"
              alt="Alex rock"
              width={36}
              height={36}
              className="rounded-full border border-[#d7d7d7]"
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
