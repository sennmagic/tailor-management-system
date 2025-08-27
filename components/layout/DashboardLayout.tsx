'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, Users, User, Calendar, Truck, Factory, Package, Ruler, DollarSign, ShoppingCart, FileText, Star, Home, Settings, Building, ShoppingBag, CreditCard, Clock, BarChart3, Layers, Database, Shield, Zap, TrendingUp, Menu, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAPI } from '@/lib/apiService'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useRouter } from 'next/navigation'

interface SidebarItem { 
  _id: string
  title: string
  type: 'header' | 'menu'
  route?: string
  hasChildren: boolean
  children?: SidebarItem[]
  parentId?: string
  permission?: string
}

interface SidebarData {
  data: SidebarItem[]
  message: string
  error: string | null
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const { unreadCount } = useNotifications()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Track navigation state - reset when pathname changes
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 800) // Reset after navigation completes
      
      return () => clearTimeout(timer)
    }
  }, [pathname, isNavigating])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const handleLogout = async () => {
    try {
      await fetchAPI({ endpoint: 'employees/logout', method: 'POST', withAuth: true });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    // Clear all possible auth tokens
    const keysToRemove = [
      'token', 
      'authToken', 
      'accessToken',
      'user', 
      'refreshToken',
      'userInfo',
      'session'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    });
    
    // Close dropdown
    setDropdownOpen(false);
    
    // Force hard redirect
    window.location.href = '/login';
  };

  useEffect(() => {
    const fetchSidebarData = async () => {
      setIsLoading(true)
      
      // Try plural endpoint first
      let { data, error } = await fetchAPI<SidebarData>({
        endpoint: "sidebars",
        method: "GET",
        withAuth: true,
      })
      
      // If plural fails, try singular endpoint
      if (error || !data) {
        console.log("Trying singular endpoint...")
        const singularResponse = await fetchAPI<SidebarData>({
          endpoint: "sidebars",
          method: "GET",
          withAuth: true,
        })
        data = singularResponse.data
        error = singularResponse.error
      }
      
      if (data) {
        setSidebarData(data)
      }
      setIsLoading(false)
    }

    fetchSidebarData()
  }, [])

  // Dynamic icon mapping based on route/title
  const getIcon = (item: SidebarItem, href?: string) => {
    const route = item.route?.toLowerCase()
    const title = item.title.toLowerCase()
    
    // Priority check for measurement - show ruler icon
    if (route === 'measurement' || title.includes('measurement')) {
      return <Ruler className="w-5 h-5" />
    }
    
    // Special handling for dashboard/home
    if (route === 'dashboards' || route === '' || href === '/' || title.includes('dashboard')) return <Home className="w-5 h-5" />
    if (route === 'employee' || title.includes('staff')) return <Users className="w-5 h-5" />
    if (route === 'customers') return <User className="w-5 h-5" />
    if (route === 'appointment') return <Calendar className="w-5 h-5" />
    if (route === 'orders') return <ShoppingCart className="w-5 h-5" />
    if (route === 'invoices') return <FileText className="w-5 h-5" />
    if (route === 'vendors') return <Truck className="w-5 h-5" />
    if (route === 'factories') return <Factory className="w-5 h-5" />
    if (route === 'catalogs') return <Package className="w-5 h-5" />
    if (route === 'expense') return <DollarSign className="w-5 h-5" />
    if (route === 'logistics') return <Truck className="w-5 h-5" />
    if (route === 'privilege') return <Star className="w-5 h-5" />
    if (route === 'sales') return <TrendingUp className="w-5 h-5" />
    
    // Title-based fallback icons
    if (title.includes('management')) return <Settings className="w-5 h-5" />
    if (title.includes('business')) return <Building className="w-5 h-5" />
    if (title.includes('catalog')) return <ShoppingBag className="w-5 h-5" />
    if (title.includes('expense')) return <CreditCard className="w-5 h-5" />
    if (title.includes('appointment')) return <Clock className="w-5 h-5" />
    if (title.includes('report')) return <BarChart3 className="w-5 h-5" />
    if (title.includes('data')) return <Database className="w-5 h-5" />
    if (title.includes('admin')) return <Shield className="w-5 h-5" />
    if (title.includes('system')) return <Zap className="w-5 h-5" />
    if (title.includes('layer')) return <Layers className="w-5 h-5" />
    if (title.includes('sales')) return <TrendingUp className="w-5 h-5" />
    
    // Default icon
    return <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
  }

  // Render menu items recursively
  const renderMenuItems = (items: SidebarItem[]) => {
    return items.map((item) => {
      if (item.type === 'header') {
        return (
          <div key={item._id} className="mt-8 first:mt-4">
            <LinkSection title={item.title}>
              {item.children && renderMenuItems(item.children)}
            </LinkSection>
          </div>
        )
      } else if (item.type === 'menu') {
        const href = item.route ? `/${item.route}` : (item.title.toLowerCase().includes('dashboard') ? '/' : '#')
        return (
          <SidebarLink 
            key={item._id} 
            href={href}
            icon={getIcon(item, href)}
            onClick={() => {
              setIsMobileMenuOpen(false)
              setIsNavigating(true)
            }}
          >
            {item.title}
          </SidebarLink>
        )
      }
      return null
    })
  }

  const SidebarContent = () => (
    <>
      <div className="mb-8 px-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative overflow-hidden">
            {/* Primary Logo - Default state */}
            <img 
              src="/RPG-Logo-Green.png" 
              alt="Rastriya Poshak Ghar Logo" 
              className={`h-10 w-auto drop-shadow-sm transition-all duration-500 ease-in-out ${
                isNavigating ? 'opacity-0 transform scale-90 rotate-12' : 'opacity-100 transform scale-100 rotate-0'
              }`}
              style={{ position: isNavigating ? 'absolute' : 'relative' }}
            />
            
            {/* Secondary Logo - Shows during navigation */}
            <img 
              src="/RPG-Logo-Golden.png" 
              alt="Navigation Logo" 
              className={`h-10 w-auto bg-[#ffffff] drop-shadow-sm  transition-all duration-500 ease-in-out ${
                isNavigating ? 'opacity-100 transform scale-100 rotate-0' : 'opacity-0 transform scale-90 -rotate-12'
              }`}
              style={{ position: isNavigating ? 'relative' : 'absolute', top: isNavigating ? 0 : '100%' }}
            />
            
            
          </div>
        </div>
       <div className="relative">
  <p
    className={`text-sm font-medium bg-clip-text text-transparent transition-all duration-300 ${
      isNavigating
        ? " bg-gradient-to-r from-[#FFD700] to-[#FFA500]  animate-pulse"
        : "bg-gradient-to-r from-emerald-600 to-teal-600"
    }`}
  >
    Tailor Management System
  </p>

  <div
    className={`absolute -bottom-1 left-0 h-0.5 rounded-full transition-all duration-300 ${
      isNavigating
        ? "w-45 bg-gradient-to-r from-[#FFD700] to-[#FFA500]  animate-pulse"
        : "w-16 bg-gradient-to-r from-emerald-500 to-transparent"
    }`}
  ></div>
</div>
      </div>

      <nav className="flex flex-col gap-1 text-sm overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-hide">
        {isLoading ? (
          <div className="space-y-3 px-1">
            <Skeleton className="w-full h-6 rounded-md" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-4/5 h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-3/4 h-10 rounded-lg" />
          </div>
        ) : sidebarData?.data ? (
          renderMenuItems(sidebarData.data)
        ) : (
          <div className="space-y-4">
            <LinkSection title="Navigation">
              <SidebarLink href="/" icon={<Home className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Dashboard</SidebarLink>
              <SidebarLink href="/employees" icon={<Users className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Staff Management</SidebarLink>
              <SidebarLink href="/customers" icon={<User className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Customers</SidebarLink>
              <SidebarLink href="/appointments" icon={<Calendar className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Appointments</SidebarLink>
              <SidebarLink href="/vendors" icon={<Truck className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Vendors</SidebarLink>
              <SidebarLink href="/factories" icon={<Factory className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Factories</SidebarLink>
              <SidebarLink href="/catalogs" icon={<Package className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Catalogs</SidebarLink>
              <SidebarLink href="/orders" icon={<ShoppingCart className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Orders</SidebarLink>
              <SidebarLink href="/invoices" icon={<FileText className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Invoices</SidebarLink>
              <SidebarLink href="/expenses" icon={<DollarSign className="w-5 h-5" />} onClick={() => { setIsMobileMenuOpen(false); setIsNavigating(true); }}>Expenses</SidebarLink>
            </LinkSection>
          </div>
        )}
      </nav>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-all duration-300" />
      )}

      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 hidden md:flex flex-col shadow-xl shadow-slate-900/5">
        <div className="flex-1 px-6 py-8 overflow-hidden">
          <SidebarContent />
        </div>
        <div className="px-6 py-4 border-t border-slate-200/60">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-emerald-700">System Online</span>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl border-r border-slate-200/60 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60">
          <span className="text-lg font-semibold text-slate-800">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="flex-1 px-6 py-6 overflow-hidden">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <header className="w-full h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search anything..." 
                  className="w-64 sm:w-80 pl-10 border-slate-200/60 bg-slate-50/50 focus:bg-white focus:border-emerald-300 transition-all duration-200 rounded-xl"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative group">
              <div className="p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 relative">
                <Bell className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white shadow-lg animate-pulse"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
            </Link>

            {/* User Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-label="User menu"
              >
                <Avatar className="ring-2 ring-emerald-500/20 ring-offset-2">
                  <AvatarImage src="/avatar.jpg" alt="User" />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600">
                    <User className="w-5 h-5 text-white" />
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-xl shadow-slate-900/10 z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-200/60 bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-800">Account</p>
                    <p className="text-xs text-slate-500">Manage your profile</p>
                  </div>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm text-red-600 font-medium transition-colors duration-200 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="p-4 md:p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )

  function SidebarLink({ href, children, icon, onClick }: { href: string; children: ReactNode; icon: ReactNode; onClick?: () => void }) {
    // Handle dashboard/home route properly - dashboard is the main page at "/"
    const isActive = pathname === href || (href === '/' && (pathname === '/' || pathname === '/dashboard' || pathname === '/dashboards'))
    
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium relative overflow-hidden ${
          isActive 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transform scale-[1.02]' 
            : 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/70 hover:transform hover:scale-[1.01]'
        }`}
      >
        <div className={`transition-all duration-200 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-600'}`}>
          {icon}
        </div>
        <span className="relative z-10">{children}</span>
        {isActive && (
          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"></div>
        )}
      </Link>
    )
  }

     function LinkSection({ title, children }: { title: string; children: ReactNode }) {
     return (
       <div>
         <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">{title}</p>
         <div className="flex flex-col space-y-2">{children}</div>
       </div>
     )
   }
}