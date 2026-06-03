import Link from 'next/link'
import { Pencil, Download } from 'lucide-react'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { OCDetailActions } from './OCDetailActions'
import type { OCDetalle } from '@/lib/mock-ocs'

interface OCDetailHeaderProps {
  oc: OCDetalle
  rol: 'importador' | 'proveedor' | 'despachante'
}

export function OCDetailHeader({ oc, rol }: OCDetailHeaderProps) {
  return (
    <header className="bg-white border-b border-acento px-4 sm:px-8 py-4">
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        <nav className="text-sm font-normal text-texto/60">
          <Link href={`/${rol}/dashboard`} className="hover:text-principal">
            Dashboard
          </Link>
          <span className="mx-1 text-texto/40">/</span>
          <span className="text-texto">{oc.numeroOC}</span>
        </nav>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-titulares">{oc.numeroOC}</h1>
            <EstadoBadge estado={oc.estado} />
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/oc/${oc.id}/pdf`}
              download
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-acento text-acento font-medium text-sm hover:bg-acento hover:text-white transition-colors min-h-[44px]"
            >
              <Download size={16} /> Exportar PDF
            </a>
            <Link
              href={`/${rol}/oc/${oc.id}/editar`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-principal text-principal font-medium text-sm hover:bg-principal hover:text-white transition-colors min-h-[44px]"
            >
              <Pencil size={16} /> Editar
            </Link>
            {rol === 'importador' && (
              <OCDetailActions numeroOC={oc.numeroOC} proveedor={oc.proveedor} />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
