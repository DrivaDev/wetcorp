'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/importador/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  // Desktop collapse state — persisted in localStorage per D-06
  const [collapsed, setCollapsed] = useState(false)

  // Mobile overlay open state
  const [mobileOpen, setMobileOpen] = useState(false)

  // Initialize collapse from localStorage or window width per D-07
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

  // Sidebar content shared between desktop and mobile overlay
  const sidebarContent = (isMobileOverlay = false) => (
    <div className="flex flex-col h-full">
      {/* Header zone */}
      <div className="flex items-center justify-between p-4 min-h-[64px]">
        {isMobileOverlay || !collapsed ? (
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="DrivaOC" width={120} height={40} priority />
          </div>
        ) : (
          <Image src="/isotipo.svg" alt="DrivaOC" width={32} height={32} priority />
        )}
        {isMobileOverlay ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="text-texto hover:text-principal p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={toggleCollapsed}
            className="text-texto hover:text-principal p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* Role subtitle — visible when expanded or in mobile overlay */}
      {(isMobileOverlay || !collapsed) && (
        <p className="px-4 pb-2 text-xs font-light text-titulares">Importador</p>
      )}

      {/* Nav zone */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg min-h-[44px] transition-colors duration-150',
                isMobileOverlay || !collapsed ? '' : 'justify-center',
                isActive
                  ? 'border-l-2 border-principal text-principal bg-acento/50'
                  : 'hover:bg-acento text-texto'
              )}
            >
              <Icon size={20} />
              {(isMobileOverlay || !collapsed) && <span>{label}</span>}
            </Link>
          )
        })}
        <Link
          href="/importador/oc/nueva"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg min-h-[44px] transition-colors duration-150',
            'bg-principal text-white hover:bg-titulares',
            isMobileOverlay || !collapsed ? '' : 'justify-center'
          )}
        >
          <PlusCircle size={20} />
          {(isMobileOverlay || !collapsed) && <span>Nueva OC</span>}
        </Link>
      </nav>

      {/* User zone */}
      <div className="p-4 border-t border-acento">
        <UserButton showName={isMobileOverlay || !collapsed} />
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top navbar — only visible on < sm (640px) per D-03 */}
      <div className="sticky top-0 z-10 flex sm:hidden items-center justify-between px-4 py-3 bg-white border-b border-acento">
        <Image src="/isotipo.svg" alt="DrivaOC" width={32} height={32} />
        <button
          onClick={() => setMobileOpen(true)}
          className="text-texto hover:text-principal p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile overlay backdrop — per D-02 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-texto/20 sm:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-in panel — per D-01, D-02 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-acento sm:hidden',
          'transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar — hidden on mobile, visible on sm+ per D-04 */}
      <aside
        className={cn(
          'hidden sm:flex flex-col h-screen bg-white border-r border-acento transition-all duration-200',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent(false)}
      </aside>
    </>
  )
}
