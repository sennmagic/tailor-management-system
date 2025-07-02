'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  BookOpen,
  ClipboardList,
  Settings,
  LayoutDashboard,
  Tags,
  FileText,
  ChevronDown,
  Bell,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r px-6 py-6 hidden md:block">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-green-600">Quick TMS</h1>
          <p className="text-sm text-gray-500">Tailor Management System</p>
        </div>

        <nav className="flex flex-col gap-6 text-sm">
          {/* Home */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Home</p>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive('/dashboard') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/customers"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive('/dashboard/customers') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <Users className="w-4 h-4" />
              Staff Management
            </Link>
          </div>

          {/* Business Management */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Business Management</p>
            <Link
              href="/dashboard/contact-diary"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive('/dashboard/contact-diary') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Contact Diary
            </Link>
            <Link
              href="/dashboard/notice-board"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive('/dashboard/notice-board') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Notice Board
            </Link>
          </div>

          {/* System Settings */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">System Settings</p>
            <Link
              href="/dashboard/cms"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive('/dashboard/cms') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              CMS
            </Link>
            <Link
              href="/dashboard/pricing"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive('/dashboard/pricing') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <Tags className="w-4 h-4" />
              Pricing
            </Link>
            <Link
              href="/dashboard/coupons"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive('/dashboard/coupons') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <Tags className="w-4 h-4" />
              Coupons
            </Link>
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive('/dashboard/settings') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
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
}
