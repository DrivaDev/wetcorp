'use client'
import Image from 'next/image'
import { UserButton } from '@clerk/nextjs'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-10 h-14 flex items-center justify-between px-6 bg-white border-b border-acento">
      <div className="hidden md:block">
        <Image
          src="/logo-horizontal.svg"
          alt="DrivaOC"
          width={140}
          height={36}
          priority
        />
      </div>
      <div className="md:hidden">
        <Image
          src="/isotipo.svg"
          alt="DrivaOC"
          width={32}
          height={32}
          priority
        />
      </div>
      <UserButton showName={true} />
    </nav>
  )
}
