'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, Users, User, Calendar, Truck, Factory, Package, Ruler, DollarSign, ShoppingCart, FileText, Star, Home, Settings, Building, ShoppingBag, CreditCard, Clock, BarChart3, Layers, Database, Shield, Zap, TrendingUp } from 'lucide-react'
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
  const { unreadCount } = useNotifications()
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
      });
      
      // If plural fails, try singular endpoint
      if (error || !data) {
        console.log("Trying singular endpoint...")
        const singularResponse = await fetchAPI<SidebarData>({
          endpoint: "sidebars",
          method: "GET",
          withAuth: true,
        });
        data = singularResponse.data;
        error = singularResponse.error;
      }
     
      
      if (data) {
        setSidebarData(data);
      }
      setIsLoading(false)
    };

    fetchSidebarData();
  }, []);

  // Dynamic icon mapping based on route/title
  const getIcon = (item: SidebarItem) => {
    const route = item.route?.toLowerCase()
    const title = item.title.toLowerCase()
    
    // Route-based icons
    if (route === 'dashboards') return <Home className="w-4 h-4" />
    if (route === 'employee' || title.includes('staff')) return <Users className="w-4 h-4" />
    if (route === 'customers') return <User className="w-4 h-4" />
    if (route === 'appointment') return <Calendar className="w-4 h-4" />
    if (route === 'orders') return <ShoppingCart className="w-4 h-4" />
    if (route === 'invoices') return <FileText className="w-4 h-4" />
    if (route === 'vendors') return <Truck className="w-4 h-4" />
    if (route === 'factories') return <Factory className="w-4 h-4" />
    if (route === 'catalogs') return <Package className="w-4 h-4" />
    if (route === 'expense') return <DollarSign className="w-4 h-4" />
    if (route === 'measurement') return <Ruler className="w-4 h-4" />
    if (route === 'logistics') return <Truck className="w-4 h-4" />
    if (route === 'privilege') return <Star className="w-4 h-4" />
    if (route === 'sales') return <TrendingUp className="w-4 h-4" />
    
    // Title-based fallback icons
    if (title.includes('management')) return <Settings className="w-4 h-4" />
    if (title.includes('business')) return <Building className="w-4 h-4" />
    if (title.includes('catalog')) return <ShoppingBag className="w-4 h-4" />
    if (title.includes('expense')) return <CreditCard className="w-4 h-4" />
    if (title.includes('appointment')) return <Clock className="w-4 h-4" />
    if (title.includes('report')) return <BarChart3 className="w-4 h-4" />
    if (title.includes('data')) return <Database className="w-4 h-4" />
    if (title.includes('admin')) return <Shield className="w-4 h-4" />
    if (title.includes('system')) return <Zap className="w-4 h-4" />
    if (title.includes('layer')) return <Layers className="w-4 h-4" />
    if (title.includes('sales')) return <TrendingUp className="w-4 h-4" />
    
    // Default icon
    return <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
  }

  // Render menu items recursively
  const renderMenuItems = (items: SidebarItem[]) => {
    return items.map((item) => {
      if (item.type === 'header') {
        return (
          <div key={item._id} className="mt-6">
            <LinkSection title={item.title}>
              {item.children && renderMenuItems(item.children)}
            </LinkSection>
          </div>
        )
      } else if (item.type === 'menu') {
        const href = item.route ? `/${item.route}` : '#'
        return (
          <SidebarLink 
            key={item._id} 
            href={href}
            icon={getIcon(item)}
          >
            {item.title}
          </SidebarLink>
        )
      }
      return null
    })
  }

  return (
    <div className="flex h-screen overflow-hidden">
             {/* Sidebar */}
       <aside className="w-64 bg-white border-r px-6 py-6 hidden md:block">
         <div className="mb-8">
           <div className="flex items-center gap-3 mb-3">
             <img 
               src="/RPG-Logo-Green.png" 
               alt="Rastriya Poshak Ghar Logo" 
               className="h-10 w-auto"
             />
           </div>
           <p className="text-sm text-gray-500">Tailor Management System</p>
         </div>

                 <nav className="flex flex-col gap-2 text-sm overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-hide">
           {isLoading ? (
             <div className="space-y-2">
               <Skeleton className="w-full h-6" />
               <Skeleton className="w-full h-8" />
               <Skeleton className="w-full h-8" />
               <Skeleton className="w-full h-8" />
             </div>
           ) : sidebarData?.data ? (
             renderMenuItems(sidebarData.data)
           ) : (
             <div className="space-y-4">
               <LinkSection title="Navigation">
                 <SidebarLink href="/" icon={<Home className="w-5 h-5" />}>Dashboard</SidebarLink>
                 <SidebarLink href="/employees" icon={<Users className="w-5 h-5" />}>Staff Management</SidebarLink>
                 <SidebarLink href="/customers" icon={<User className="w-5 h-5" />}>Customers</SidebarLink>
                 <SidebarLink href="/appointments" icon={<Calendar className="w-5 h-5" />}>Appointments</SidebarLink>
                 <SidebarLink href="/vendors" icon={<Truck className="w-5 h-5" />}>Vendors</SidebarLink>
                 <SidebarLink href="/factories" icon={<Factory className="w-5 h-5" />}>Factories</SidebarLink>
                 <SidebarLink href="/catalogs" icon={<Package className="w-5 h-5" />}>Catalogs</SidebarLink>
                 <SidebarLink href="/orders" icon={<ShoppingCart className="w-5 h-5" />}>Orders</SidebarLink>
                 <SidebarLink href="/invoices" icon={<FileText className="w-5 h-5" />}>Invoices</SidebarLink>
                 <SidebarLink href="/expenses" icon={<DollarSign className="w-5 h-5" />}>Expenses</SidebarLink>
               </LinkSection>
             </div>
           )}
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
            <Link href="/notifications" className="relative">
              <Bell className="w-5 h-5 text-gray-500" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
            {/* User Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 focus:outline-none"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-label="User menu"
              >
                <Avatar>
                  <AvatarImage src="/avatar.jpg" alt="User" />
                  <AvatarFallback>
                    <User className="w-6 h-6 text-gray-700" />
                  </AvatarFallback>
                </Avatar>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6 bg-gray-50 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )

     function SidebarLink({ href, children, icon }: { href: string; children: ReactNode; icon: ReactNode }) {
     const isActive = pathname === href
     
     return (
       <Link
         href={href}
                   className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${
            isActive 
              ? 'bg-primary text-white shadow-lg' 
              : 'text-gray-700 hover:text-primary hover:bg-primary/10'
          }`}
       >
         {icon}
         {children}
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