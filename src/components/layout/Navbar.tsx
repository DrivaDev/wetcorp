'use client'
import Image from 'next/image'
import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'

interface NavbarProps {
  rol: 'proveedor' | 'despachante'
}

const ROL_LABEL: Record<NavbarProps['rol'], string> = {
  proveedor: 'Proveedor',
  despachante: 'Despachante',
}

export function Navbar({ rol }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 bg-[#002344] border-b border-white/10 min-h-[64px]">
      <Link href={`/${rol}/dashboard`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <Image src="/isotipo.svg" alt="Sistema integral COMEX" width={32} height={32} priority />
        <div className="flex flex-col">
          <span className="text-white text-sm font-medium leading-none">Sistema integral COMEX</span>
          <span className="text-white/40 text-xs font-light mt-0.5">{ROL_LABEL[rol]}</span>
        </div>
      </Link>
      <SignOutButton>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150 text-sm min-h-[44px]"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
          <span className="hidden sm:block font-light">Cerrar sesión</span>
        </button>
      </SignOutButton>
    </nav>
  )
}
