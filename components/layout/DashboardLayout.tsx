'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r px-6 py-6 hidden md:block">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-green-600">Quick TMS</h1>
          <p className="text-sm text-gray-500">Tailor Management System</p>
        </div>

        <nav className="flex flex-col gap-4 text-sm">
          <LinkSection title="Introduction">
            <SidebarLink href="/employees">Employees</SidebarLink>
            <SidebarLink href="/customers">Customers</SidebarLink>
            <SidebarLink href="/appointments">Appointments</SidebarLink>
            <SidebarLink href="/vendors">Vendors</SidebarLink>
            <SidebarLink href="/logistics">Logistics</SidebarLink>
            <SidebarLink href="/factories">Factories</SidebarLink>
            <SidebarLink href="/catalogs">Catalogs</SidebarLink>
            <SidebarLink href="/measurements">Measurements</SidebarLink>
            <SidebarLink href="/vendorExpenses">vendorExpenses</SidebarLink>
            <SidebarLink href="/orders">Orders</SidebarLink>
            <SidebarLink href="/factoryExpense">factoryExpense</SidebarLink>
            <SidebarLink href="/invoices">Invoices</SidebarLink>
            <SidebarLink href="/privilegePoints">privilegePoints</SidebarLink>
          </LinkSection>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <header className="w-full h-16 flex items-center justify-between px-6 border-b bg-white">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input placeholder="Search..." className="w-64" />
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-500" />
            <Avatar>
              <img src="/avatar.jpg" alt="User" />
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6 bg-gray-50 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )

  function SidebarLink({ href, children }: { href: string; children: ReactNode }) {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 px-3 py-2 rounded-md ${
          isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        {children}
      </Link>
    )
  }

  function LinkSection({ title, children }: { title: string; children: ReactNode }) {
    return (
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">{title}</p>
        <div className="flex flex-col space-y-1">{children}</div>
      </div>
    )
  }
}
