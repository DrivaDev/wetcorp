'use client'

interface DeleteModalProps {
  open: boolean
  ocNumero: string
  proveedor: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function DeleteModal({ open, ocNumero, proveedor, onConfirm, onCancel, loading }: DeleteModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-texto/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-acento p-6 max-w-sm w-full flex flex-col gap-4">
        <p className="text-xl font-bold text-titulares">¿Eliminar esta OC?</p>
        <p className="text-base text-texto/70">
          Estás por eliminar la OC {ocNumero} de {proveedor}. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="border border-acento text-texto hover:bg-fondo px-4 py-2 rounded-lg font-normal min-h-[44px] transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium min-h-[44px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
