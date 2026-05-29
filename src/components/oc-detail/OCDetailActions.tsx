'use client'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { DeleteModal } from '@/components/dashboard/DeleteModal'

interface OCDetailActionsProps {
  numeroOC: string
  proveedor: string
}

export function OCDetailActions({ numeroOC, proveedor }: OCDetailActionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors min-h-[44px]"
        aria-label="Eliminar OC"
      >
        <Trash2 size={16} /> Eliminar
      </button>
      <DeleteModal
        open={open}
        ocNumero={numeroOC}
        proveedor={proveedor}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
