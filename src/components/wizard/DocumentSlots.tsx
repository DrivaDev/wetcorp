'use client'
import { useState, useRef } from 'react'
import { Plus, Upload, X, FileText } from 'lucide-react'

const FIXED_SLOTS = [
  'Factura proveedor',
  'Factura despachante',
  'Conocimiento de embarque',
  'Certificado de Origen',
]

const FIXED_SLOT_KEYS: Record<string, keyof NonNullable<DocumentSlotsProps['documentos']>> = {
  'Factura proveedor':        'facturaProveedor',
  'Factura despachante':      'facturaDespachante',
  'Conocimiento de embarque': 'conocimientoEmbarque',
  'Certificado de Origen':    'certificadoOrigen',
}

interface OtroSlot {
  id: string
  nombre: string
  fileName: string | null
}

interface DocumentSlotsProps {
  readOnly?: boolean
  documentos?: {
    facturaProveedor: string | null
    facturaDespachante: string | null
    conocimientoEmbarque: string | null
    certificadoOrigen: string | null
    otro: string | null
  }
}

function DocumentRow({
  nombre,
  onNameChange,
  onRemove,
  readOnly,
  fileNameProp,
}: {
  nombre: string
  onNameChange?: (v: string) => void
  onRemove?: () => void
  readOnly?: boolean
  fileNameProp?: string | null
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.files?.[0]?.name ?? null)
  }

  const displayFileName = readOnly ? (fileNameProp ?? 'Sin archivo adjunto') : (fileName ?? 'Sin archivo adjunto')

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <FileText size={18} className="text-acento shrink-0" />

      {onNameChange ? (
        <input
          type="text"
          value={nombre}
          placeholder="Nombre del documento"
          onChange={(e) => onNameChange(e.target.value)}
          className="flex-1 text-base font-normal text-texto bg-transparent border-b border-acento/50 focus:outline-none focus:border-principal placeholder:text-texto/40"
        />
      ) : (
        <span className="flex-1 text-base font-normal text-texto">{nombre}</span>
      )}

      <span className="text-sm font-normal text-texto/50 hidden sm:block shrink-0 max-w-[180px] truncate">
        {displayFileName}
      </span>

      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFile}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 text-sm font-normal text-principal hover:text-titulares border border-principal/40 hover:border-principal rounded-lg px-3 py-1.5 transition-colors min-h-[36px] shrink-0"
          >
            <Upload size={14} />
            {fileName ? 'Cambiar' : 'Adjuntar'}
          </button>

          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Eliminar documento"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function DocumentSlots({ readOnly, documentos }: DocumentSlotsProps = {}) {
  const [otrosSlots, setOtrosSlots] = useState<OtroSlot[]>([])

  const addOtro = () =>
    setOtrosSlots((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nombre: '', fileName: null },
    ])

  const removeOtro = (id: string) =>
    setOtrosSlots((prev) => prev.filter((s) => s.id !== id))

  const updateNombre = (id: string, nombre: string) =>
    setOtrosSlots((prev) => prev.map((s) => (s.id === id ? { ...s, nombre } : s)))

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-bold text-titulares">Documentos</h2>
        <p className="text-sm font-normal text-texto/60 mt-0.5">Solo se aceptan archivos PDF</p>
      </div>

      <div className="rounded-xl border border-acento bg-white divide-y divide-acento/40 overflow-hidden">
        {FIXED_SLOTS.map((nombre) => (
          <DocumentRow
            key={nombre}
            nombre={nombre}
            readOnly={readOnly}
            fileNameProp={documentos ? documentos[FIXED_SLOT_KEYS[nombre]] : null}
          />
        ))}
        {!readOnly && otrosSlots.map((slot) => (
          <DocumentRow
            key={slot.id}
            nombre={slot.nombre}
            onNameChange={(v) => updateNombre(slot.id, v)}
            onRemove={() => removeOtro(slot.id)}
          />
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={addOtro}
          className="flex items-center gap-2 text-sm font-normal text-principal hover:text-titulares transition-colors min-h-[44px] self-start"
        >
          <Plus size={16} />
          Agregar otro documento
        </button>
      )}
    </div>
  )
}
