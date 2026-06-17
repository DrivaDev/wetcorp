'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Pencil, Trash2, Loader2, X, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OC, EstadoOC } from '@/lib/mock-ocs'
import { DeleteModal } from './DeleteModal'
import { EmptyState } from './EmptyState'
import { deleteOC, getOCById } from '@/actions/oc'
import type { SerializedOC } from '@/actions/oc'
import { OCPreviewModal } from './OCPreviewModal'

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
        <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap w-[110px]">Llegada est.</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap">Notas</th>
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
      <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-acento/20" /></td>
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
  const [previewLoading, setPreviewLoading] = useState<string | null>(null)
  const [previewOC, setPreviewOC] = useState<SerializedOC | null>(null)
  const [notaModal, setNotaModal] = useState<string | null>(null)
  const router = useRouter()

  const handlePreview = async (ocId: string) => {
    setPreviewLoading(ocId)
    try {
      const result = await getOCById(ocId)
      if ('data' in result) setPreviewOC(result.data.oc)
    } finally {
      setPreviewLoading(null)
    }
  }

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

  const pencilHref = (oc: OC) => `/${rol}/oc/${oc.id}/editar`

  return (
    <>
      {previewOC && (
        <OCPreviewModal
          oc={previewOC}
          rol={rol}
          onClose={() => setPreviewOC(null)}
        />
      )}
      {notaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setNotaModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-titulares">Nota</h3>
              <button
                onClick={() => setNotaModal(null)}
                className="p-1.5 rounded-lg text-texto/40 hover:text-texto hover:bg-acento/40 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-texto whitespace-pre-wrap leading-relaxed">{notaModal}</p>
            <button
              onClick={() => setNotaModal(null)}
              className="self-end px-4 py-2 rounded-lg border border-acento text-texto text-sm font-medium hover:bg-acento/30 transition-colors min-h-[40px]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
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
                <td className="px-4 py-3 text-base text-texto">{oc.llegadaEstimada ? formatFecha(oc.llegadaEstimada) : <span className="text-texto/30">—</span>}</td>
                <td className="px-4 py-3 max-w-[200px]">
                  {oc.notas ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-texto leading-snug line-clamp-2">{oc.notas}</p>
                      <button
                        type="button"
                        onClick={() => setNotaModal(oc.notas!)}
                        className="flex items-center gap-1 text-xs text-principal hover:text-titulares self-start"
                      >
                        <MessageSquare size={11} /> Ver nota
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-texto/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreview(oc.id)}
                      disabled={previewLoading === oc.id}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-texto hover:text-principal hover:bg-acento/30 transition-colors duration-150 disabled:opacity-50"
                      aria-label="Visualizar OC"
                    >
                      {previewLoading === oc.id
                        ? <Loader2 size={18} className="animate-spin" />
                        : <Eye size={18} />}
                    </button>
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
