'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserButton, SignOutButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/importador/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) {
      setCollapsed(stored === 'true')
    } else {
      setCollapsed(window.innerWidth < 1024)
    }
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const sidebarContent = (isMobileOverlay = false) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      {isMobileOverlay || !collapsed ? (
        <div className="flex items-center justify-between px-4 min-h-[64px] border-b border-white/10">
          <Image src="/logo-horizontal.svg" alt="DrivaOC" width={140} height={40} priority className="object-contain" />
          <button
            onClick={isMobileOverlay ? () => setMobileOpen(false) : toggleCollapsed}
            className="text-white/60 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors duration-150"
            aria-label={isMobileOverlay ? 'Cerrar menú' : 'Colapsar sidebar'}
          >
            {isMobileOverlay ? <X size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[64px] border-b border-white/10">
          <button
            onClick={toggleCollapsed}
            className="text-white/60 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors duration-150"
            aria-label="Expandir sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Role subtitle */}
      {(isMobileOverlay || !collapsed) && (
        <p className="px-4 pt-4 pb-1 text-xs font-light text-white/40 uppercase tracking-widest">
          Importador
        </p>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 mt-1">
        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg min-h-[44px] transition-colors duration-150',
                collapsed && !isMobileOverlay ? 'justify-center' : '',
                isActive
                  ? 'border-l-2 border-principal text-principal bg-principal/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon size={20} />
              {(isMobileOverlay || !collapsed) && <span className="text-sm font-medium">{label}</span>}
            </Link>
          )
        })}

        <Link
          href="/importador/oc/nueva"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg min-h-[44px] transition-colors duration-150',
            'bg-principal text-white hover:bg-titulares',
            collapsed && !isMobileOverlay ? 'justify-center' : ''
          )}
        >
          <PlusCircle size={20} />
          {(isMobileOverlay || !collapsed) && <span className="text-sm font-medium">Nueva OC</span>}
        </Link>
      </nav>

      {/* User zone */}
      <div className="p-3 border-t border-white/10 flex flex-col gap-2">
        <UserButton
          showName={isMobileOverlay || !collapsed}
          appearance={{ elements: { userButtonBox: 'text-white' } }}
        />
        <SignOutButton>
          <button
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg min-h-[44px] text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-150 text-sm w-full',
              collapsed && !isMobileOverlay ? 'justify-center' : ''
            )}
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
            {(isMobileOverlay || !collapsed) && <span className="font-light">Cerrar sesión</span>}
          </button>
        </SignOutButton>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top navbar */}
      <div className="sticky top-0 z-10 flex sm:hidden items-center justify-between px-4 py-3 bg-[#1C1917] border-b border-white/10">
        <Image src="/logo-horizontal.svg" alt="DrivaOC" width={120} height={34} className="object-contain" />
        <div className="flex items-center gap-1">
          <SignOutButton>
            <button
              className="text-white/60 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors duration-150"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </SignOutButton>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white/60 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors duration-150"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-in panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#1C1917] border-r border-white/10 sm:hidden',
          'transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden sm:flex flex-col h-full flex-shrink-0 bg-[#1C1917] border-r border-white/10 transition-all duration-200',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent(false)}
      </aside>
    </>
  )
}
