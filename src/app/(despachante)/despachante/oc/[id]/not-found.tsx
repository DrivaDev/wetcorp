import Link from 'next/link'
import { FileSearch, ArrowLeft } from 'lucide-react'

export default function OCNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center px-4">
      <FileSearch size={64} className="text-acento" />
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold text-titulares">OC no encontrada</h1>
        <p className="text-base font-normal text-texto/70 max-w-sm">
          No pudimos encontrar la orden de compra que buscás. Puede que haya sido eliminada o que el enlace sea incorrecto.
        </p>
      </div>
      <Link
        href="/despachante/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-principal text-white font-medium hover:bg-titulares transition-colors duration-150 min-h-[44px]"
      >
        <ArrowLeft size={18} /> Volver al dashboard
      </Link>
    </div>
  )
}
