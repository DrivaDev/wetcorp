'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OC, EstadoOC } from '@/lib/mock-ocs'
import { DeleteModal } from './DeleteModal'
import { EmptyState } from './EmptyState'
import { deleteOC } from '@/actions/oc'

type Rol = 'importador' | 'proveedor' | 'despachante'

interface OCTableProps {
  ocs: OC[]
  rol: Rol
  isLoading?: boolean
  hasFilters?: boolean
}

function getBadgeClasses(estado: EstadoOC): string {
  const base = 'text-sm px-2 py-0.5 rounded-full'
  const map: Record<EstadoOC, string> = {
    borrador:    `${base} bg-fondo text-titulares border border-acento font-light`,
    en_proceso:  `${base} bg-acento/50 text-titulares font-light`,
    en_transito: `${base} bg-acento text-titulares font-normal`,
    en_aduana:   `${base} bg-principal/20 text-titulares font-normal`,
    entregada:   `${base} bg-principal/10 text-principal font-normal`,
    cancelada:   `${base} bg-texto/10 text-texto font-light line-through`,
  }
  return map[estado]
}

const ESTADO_LABELS: Record<EstadoOC, string> = {
  borrador:    'Borrador',
  en_proceso:  'En proceso',
  en_transito: 'En tránsito',
  en_aduana:   'En aduana',
  entregada:   'Entregada',
  cancelada:   'Cancelada',
}

function formatFecha(iso: string): string {
  const date = iso.split('T')[0]
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function TableHead({ rol }: { rol: Rol }) {
  return (
    <thead className="bg-fondo border-b border-acento">
      <tr>
        <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap w-[100px]">Nº OC</th>
        {rol !== 'proveedor' && (
          <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap">Proveedor</th>
        )}
        {rol !== 'despachante' && (
          <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap">Despachante</th>
        )}
        <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap w-[130px]">Despacho</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap w-[140px]">Estado</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap w-[110px]">Fecha</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap w-[100px]">Acciones</th>
      </tr>
    </thead>
  )
}

function SkeletonCells({ rol }: { rol: Rol }) {
  const extraCols = rol === 'importador' ? 2 : 1
  return (
    <>
      <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-acento/30" /></td>
      {Array.from({ length: extraCols }).map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="h-4 w-32 rounded bg-acento/30" /></td>
      ))}
      <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-acento/30" /></td>
      <td className="px-4 py-3"><div className="h-5 w-20 rounded-full bg-acento/40" /></td>
      <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-acento/30" /></td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <div className="h-8 w-8 rounded-lg bg-acento/30" />
          <div className="h-8 w-8 rounded-lg bg-acento/30" />
        </div>
      </td>
    </>
  )
}

export function OCTable({ ocs, rol, isLoading, hasFilters = false }: OCTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<OC | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteOC(deleteTarget.id)
    setDeleteTarget(null)
    setDeleting(false)
    router.refresh()
  }

  const minWidth = rol === 'importador' ? 'min-w-[920px]' : 'min-w-[720px]'

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-acento bg-white">
        <table className={cn('w-full text-base', minWidth)}>
          <TableHead rol={rol} />
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-acento/50 animate-pulse">
                <SkeletonCells rol={rol} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (ocs.length === 0) {
    return <EmptyState rol={rol} hasFilters={hasFilters} />
  }

  const eyeHref = (oc: OC) => `/${rol}/oc/${oc.id}`
  const pencilHref = (oc: OC) => `/${rol}/oc/${oc.id}/editar`

  return (
    <>
      <div className="w-full overflow-x-auto rounded-xl border border-acento bg-white">
        <table className={cn('w-full text-base', minWidth)}>
          <TableHead rol={rol} />
          <tbody>
            {ocs.map((oc) => (
              <tr key={oc.id} className="border-b border-acento/50 hover:bg-acento/20 transition-colors duration-150">
                <td className="px-4 py-3 w-[100px]">
                  <span className="font-medium text-titulares">{oc.numeroOC}</span>
                </td>
                {rol !== 'proveedor' && (
                  <td className="px-4 py-3 text-base text-texto">{oc.proveedor}</td>
                )}
                {rol !== 'despachante' && (
                  <td className="px-4 py-3 text-base text-texto">{oc.despachante}</td>
                )}
                <td className="px-4 py-3 text-base text-texto">
                  {oc.numeroDespacho || <span className="text-texto/30">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(getBadgeClasses(oc.estado))}>
                    {ESTADO_LABELS[oc.estado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-base text-texto">{formatFecha(oc.fecha)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={eyeHref(oc)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-texto hover:text-principal hover:bg-acento/30 transition-colors duration-150"
                      aria-label="Visualizar OC"
                    >
                      <Eye size={18} />
                    </Link>
                    <Link
                      href={pencilHref(oc)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-texto hover:text-principal hover:bg-acento/30 transition-colors duration-150"
                      aria-label="Editar OC"
                    >
                      <Pencil size={18} />
                    </Link>
                    {rol === 'importador' && (
                      <button
                        onClick={() => setDeleteTarget(oc)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-150"
                        aria-label="Eliminar OC"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DeleteModal
        open={deleteTarget !== null}
        ocNumero={deleteTarget?.numeroOC ?? ''}
        proveedor={deleteTarget?.proveedor ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
