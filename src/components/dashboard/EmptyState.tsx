import Link from 'next/link'
import { FileText, PlusCircle } from 'lucide-react'

interface EmptyStateProps {
  rol: 'importador' | 'proveedor' | 'despachante'
  hasFilters: boolean
}

export function EmptyState({ rol, hasFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <FileText size={48} className="text-acento" />
      <p className="text-xl font-bold text-titulares">
        {hasFilters ? 'No hay resultados para tu búsqueda' : 'No hay órdenes de compra'}
      </p>
      <p className="text-base font-normal text-texto/70 max-w-sm">
        {hasFilters
          ? 'Probá cambiando el filtro de estado o el nombre del proveedor.'
          : 'Todavía no creaste ninguna OC. Comenzá creando tu primera orden de compra.'}
      </p>
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
