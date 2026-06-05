'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Package, Truck, Loader2 } from 'lucide-react'
import { completeOnboarding } from './_actions'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type Role = 'proveedor' | 'despachante'

const IMPORTADOR_EMAILS = ['driva.devv@gmail.com', 'compras@wet-corp.com']

const ROLE_REDIRECTS = {
  importador:  '/importador/dashboard',
  proveedor:   '/proveedor/dashboard',
  despachante: '/despachante/dashboard',
} as const

const ROLES: { id: Role; Icon: React.ElementType; title: string; description: string }[] = [
  { id: 'proveedor',   Icon: Package, title: 'Proveedor',   description: 'Veo las OCs donde estoy asignado' },
  { id: 'despachante', Icon: Truck,   title: 'Despachante', description: 'Veo las OCs donde estoy asignado' },
]

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [selected, setSelected] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? ''
  const isImportador = IMPORTADOR_EMAILS.includes(primaryEmail)

  useEffect(() => {
    if (isImportador && user) {
      setLoading(true)
      completeOnboarding('importador' as never).then(result => {
        if ('error' in result) {
          setError(result.error)
          setLoading(false)
          return
        }
        user.reload().then(() => router.push(ROLE_REDIRECTS.importador))
      })
    }
  }, [isImportador, user, router])

  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const result = await completeOnboarding(selected)
      if ('error' in result) {
        setError(result.error)
        return
      }
      if (!user) {
        setError('Error de sesión. Por favor recargá la página.')
        return
      }
      await user.reload()
      router.push(ROLE_REDIRECTS[selected])
    } finally {
      setLoading(false)
    }
  }

  if (isImportador) {
    return (
      <div className="w-full max-w-2xl px-4 text-center">
        <Image src="/logo-horizontal.svg" alt="Sistema integral COMEX" width={180} height={52} className="mx-auto mb-8 object-contain" />
        <Loader2 size={32} className="animate-spin text-principal mx-auto mb-4" />
        <p className="text-base text-texto/70">Configurando tu cuenta…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl px-4">
      <div className="text-center mb-8">
        <Image src="/logo-horizontal.svg" alt="Sistema integral COMEX" width={180} height={52} className="mx-auto mb-4 object-contain" />
        <h1 className="text-2xl font-bold text-titulares">Selecciona tu rol</h1>
        <p className="text-base text-texto/70 mt-2">¿Cómo vas a usar el sistema?</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        {ROLES.map(({ id, Icon, title, description }) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={cn(
              'border-2 rounded-xl p-6 cursor-pointer text-left',
              'transition-all duration-150 active:scale-[0.98]',
              selected === id
                ? 'border-principal bg-acento/30'
                : 'border-acento hover:border-principal hover:bg-acento/30'
            )}
          >
            <Icon size={32} className="text-principal mb-3" />
            <p className="font-medium text-base text-texto">{title}</p>
            <p className="font-light text-sm text-texto/70 mt-1">{description}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="text-center">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-principal text-white px-8 py-3 rounded-lg font-medium hover:bg-titulares transition-colors duration-150 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Configurando cuenta…' : 'Continuar'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-center text-red-600 text-sm mt-4">{error}</p>
      )}
    </div>
  )
}
