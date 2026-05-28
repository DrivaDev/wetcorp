'use client'
import { useState } from 'react'
import { Upload, Plus, X } from 'lucide-react'

const FIXED_SLOTS = [
  'Factura proveedor',
  'Factura despachante',
  'Conocimiento de embarque',
  'Certificado de Origen',
]

function Slot({ nombre, onRemove }: { nombre: string; onRemove?: () => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-acento bg-white p-6 flex flex-col items-center justify-center gap-3 min-h-[120px] relative">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Eliminar documento"
          className="absolute top-2 right-2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <X size={14} />
        </button>
      )}
      <Upload size={32} className="text-acento" />
      <p className="text-sm font-normal text-titulares text-center">{nombre}</p>
      <p className="text-sm font-normal text-texto/60 text-center">Sin archivo adjunto</p>
    </div>
  )
}

export function DocumentSlots() {
  const [otrosSlots, setOtrosSlots] = useState<string[]>([])

  const addOtro = () => setOtrosSlots((prev) => [...prev, `Otro documento ${prev.length + 1}`])
  const removeOtro = (idx: number) => setOtrosSlots((prev) => prev.filter((_, i) => i !== idx))

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-titulares">Documentos</h2>
      <p className="text-sm font-normal text-texto/60 -mt-2">Solo se aceptan archivos PDF</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FIXED_SLOTS.map((nombre) => (
          <Slot key={nombre} nombre={nombre} />
        ))}
        {otrosSlots.map((nombre, idx) => (
          <Slot key={idx} nombre={nombre} onRemove={() => removeOtro(idx)} />
        ))}
      </div>
      <button
        type="button"
        onClick={addOtro}
        className="flex items-center gap-2 text-sm font-normal text-principal hover:text-titulares transition-colors min-h-[44px] self-start"
      >
        <Plus size={16} />
        Agregar otro documento
      </button>
    </div>
  )
}
