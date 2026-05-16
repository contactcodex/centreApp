'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

export type PageName =
  | 'login'
  | 'super-admin'
  | 'super-admin-centres'
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'groups'
  | 'payments'
  | 'settings'

interface AppSidebarProps {
  currentPage: PageName
  onNavigate: (page: PageName) => void
  onLogout: () => void
  user: {
    name: string
    email: string
    role: string
    centreName?: string | null
  }
}

interface MenuItem {
  id: PageName
  label: string
  icon: React.ReactNode
}

export default function AppSidebar({ currentPage, onNavigate, onLogout, user }: AppSidebarProps) {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const superAdminMenu: MenuItem[] = [
    { id: 'super-admin', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'super-admin-centres', label: 'إدارة المراكز', icon: <Building2 className="w-5 h-5" /> },
  ]

  const centreAdminMenu: MenuItem[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'students', label: 'التلاميذ', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'teachers', label: 'الأساتذة', icon: <Users className="w-5 h-5" /> },
    { id: 'groups', label: 'الأقسام', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'payments', label: 'الأقساط', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-5 h-5" /> },
  ]

  const menuItems = user.role === 'SUPER_ADMIN' ? superAdminMenu : centreAdminMenu

  const isActive = (pageId: PageName) => {
    if (pageId === 'super-admin' && currentPage === 'super-admin') return true
    if (pageId === 'super-admin-centres' && currentPage === 'super-admin-centres') return true
    return currentPage === pageId
  }

  const handleNavigate = (page: PageName) => {
    onNavigate(page)
    setSheetOpen(false)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate">
              {user.role === 'SUPER_ADMIN' ? 'المدير العام' : (user.centreName || 'المركز')}
            </h2>
            <p className="text-xs text-muted-foreground truncate">نظام الإدارة</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={isActive(item.id) ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 ${
                isActive(item.id) ? 'bg-primary/10 text-primary font-medium' : ''
              }`}
              onClick={() => handleNavigate(item.id)}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <Separator />
      <div className="p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              onClick={onLogout}
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onLogout}
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="px-3 pb-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {!collapsed && <span className="mr-2 text-xs">تصغير القائمة</span>}
          </Button>
        </div>
      )}
    </div>
  )

  // Mobile: use Sheet
  if (isMobile) {
    return (
      <>
        {/* Mobile header bar */}
        <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-background border-b">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h1 className="font-bold text-sm truncate">
              {user.role === 'SUPER_ADMIN' ? 'إدارة المراكز' : (user.centreName || 'المركز')}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </>
    )
  }

  // Desktop: fixed sidebar
  return (
    <aside
      className={`sticky top-0 h-screen bg-card border-l border-border transition-all duration-300 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {sidebarContent}
    </aside>
  )
}
