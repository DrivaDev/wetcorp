import Link from 'next/link'
import { FileText, PlusCircle } from 'lucide-react'

interface EmptyStateProps {
  rol: 'importador' | 'proveedor' | 'despachante'
  hasFilters: boolean
}

export function EmptyState({ rol, hasFilters }: EmptyStateProps) {
  let heading: string
  let body: string

  if (hasFilters) {
    heading = 'Sin resultados'
    body = 'Probá cambiando el filtro de estado o el nombre del proveedor.'
  } else if (rol === 'importador') {
    heading = 'Todavía no hay OCs'
    body = '¡Creá tu primera orden de compra!'
  } else {
    heading = 'No hay OCs asignadas'
    body = 'Cuando un importador te asigne una OC, aparecerá aquí.'
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <FileText size={48} className="text-acento" />
      <p className="text-lg font-bold text-titulares">{heading}</p>
      <p className="text-base font-normal text-texto/70 max-w-sm">{body}</p>
      {!hasFilters && rol === 'importador' && (
        <Link
          href="/importador/oc/nueva"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-principal text-white font-medium hover:bg-titulares transition-colors duration-150 min-h-[44px]"
        >
          <PlusCircle size={18} />
          Nueva OC
        </Link>
      )}
    </div>
  )
}
