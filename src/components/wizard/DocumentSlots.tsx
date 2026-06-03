'use client'
import { useState } from 'react'
import { FileText, ExternalLink, Upload, X } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'
import { updateOCDocumento } from '@/actions/oc'

const FIXED_SLOTS = [
  'Factura proveedor',
  'Factura despachante',
  'B/L',
  'Certificado de Origen',
  'Certificado de Análisis',
  'Packing list',
  'Otro',
]

const FIXED_SLOT_KEYS: Record<string, string> = {
  'Factura proveedor':      'facturaProveedor',
  'Factura despachante':    'facturaDespachante',
  'B/L':                    'conocimientoEmbarque',
  'Certificado de Origen':  'certificadoOrigen',
  'Certificado de Análisis': 'certificadoAnalisis',
  'Packing list':           'packingList',
  'Otro':                   'otro',
}

interface DocumentSlotsProps {
  readOnly?: boolean
  ocId?: string
  documentos?: {
    facturaProveedor: string | null
    facturaDespachante: string | null
    conocimientoEmbarque: string | null
    certificadoOrigen: string | null
    certificadoAnalisis?: string | null
    packingList?: string | null
    otro: string | null
  }
}

function DocumentRow({
  nombre,
  slotKey,
  ocId,
  existingUrl,
  readOnly,
  onNameChange,
  onRemove,
  onUploadAttempt,
  openSlot,
  onUploadSuccess,
  onWidgetClose,
}: {
  nombre: string
  slotKey: string
  ocId?: string
  existingUrl?: string | null
  readOnly?: boolean
  onNameChange?: (v: string) => void
  onRemove?: () => void
  onUploadAttempt: (slot: string, existingUrl: string | null | undefined) => void
  openSlot: string | null
  onUploadSuccess: (slot: string, url: string) => void
  onWidgetClose: () => void
}) {
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

      {readOnly ? (
        existingUrl ? (
          <a
            href={existingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-normal text-principal hover:text-titulares border border-principal/40 hover:border-principal rounded-lg px-3 py-1.5 transition-colors min-h-[36px] shrink-0"
          >
            <ExternalLink size={14} />
            Ver archivo
          </a>
        ) : (
          <span className="text-sm font-normal text-texto/40 shrink-0">Sin archivo</span>
        )
      ) : (
        <>
          <span className="text-sm font-normal text-texto/50 hidden sm:block shrink-0 max-w-[180px] truncate">
            {existingUrl ? 'Archivo adjunto' : 'Sin archivo adjunto'}
          </span>

          <CldUploadWidget
            signatureEndpoint="/api/sign-cloudinary-params"
            options={{ resourceType: 'raw', folder: 'drivaoc-docs' }}
            onSuccess={(result) => {
              const url = (result.info as { secure_url: string }).secure_url
              onUploadSuccess(slotKey, url)
            }}
            onClose={onWidgetClose}
          >
            {({ open }) => (
              <>
                {openSlot === slotKey && (() => { open(); return null })()}
                <button
                  type="button"
                  onClick={() => onUploadAttempt(slotKey, existingUrl)}
                  className="flex items-center gap-1.5 text-sm font-normal text-principal hover:text-titulares border border-principal/40 hover:border-principal rounded-lg px-3 py-1.5 transition-colors min-h-[36px] shrink-0"
                >
                  <Upload size={14} />
                  {existingUrl ? 'Cambiar' : 'Adjuntar'}
                </button>
              </>
            )}
          </CldUploadWidget>

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

export function DocumentSlots({ readOnly, ocId, documentos }: DocumentSlotsProps = {}) {
  const [confirmSlot, setConfirmSlot] = useState<string | null>(null)
  const [openSlot, setOpenSlot] = useState<string | null>(null)

  const handleUploadAttempt = (slot: string, existingUrl: string | null | undefined) => {
    if (existingUrl) {
      setConfirmSlot(slot)
    } else {
      setOpenSlot(slot)
    }
  }

  const handleUploadSuccess = (slot: string, url: string) => {
    if (ocId) {
      updateOCDocumento(ocId, slot, url).then((result) => {
        if ('error' in result) {
          console.error('Error saving document:', result.error)
        }
        setOpenSlot(null)
      }).catch((err) => {
        console.error('Error saving document:', err)
        setOpenSlot(null)
      })
    } else {
      setOpenSlot(null)
    }
  }

  const handleWidgetClose = () => {
    setOpenSlot(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-bold text-titulares">Documentos</h2>
        <p className="text-sm font-normal text-texto/60 mt-0.5">Solo se aceptan archivos PDF</p>
      </div>

      <div className="rounded-xl border border-acento bg-white divide-y divide-acento/40 overflow-hidden">
        {FIXED_SLOTS.map((nombre) => {
          const slotKey = FIXED_SLOT_KEYS[nombre]
          const existingUrl = documentos
            ? documentos[slotKey as keyof typeof documentos] as string | null | undefined
            : null
          return (
            <DocumentRow
              key={nombre}
              nombre={nombre}
              slotKey={slotKey}
              ocId={ocId}
              existingUrl={existingUrl}
              readOnly={readOnly}
              openSlot={openSlot}
              onUploadAttempt={handleUploadAttempt}
              onUploadSuccess={handleUploadSuccess}
              onWidgetClose={handleWidgetClose}
            />
          )
        })}

      </div>

      {confirmSlot !== null && (
        <div className="fixed inset-0 z-50 bg-texto/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-acento p-6 max-w-sm w-full flex flex-col gap-4">
            <p className="text-base font-medium text-titulares">¿Reemplazar el archivo existente?</p>
            <p className="text-sm font-normal text-texto/70">Esta acción reemplazará el PDF actual del slot.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmSlot(null)}
                className="border border-acento text-texto hover:bg-fondo px-4 py-2 rounded-lg font-normal min-h-[44px] transition-colors duration-150"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { setOpenSlot(confirmSlot); setConfirmSlot(null) }}
                className="bg-principal text-white hover:bg-titulares px-4 py-2 rounded-lg font-medium min-h-[44px] transition-colors duration-150"
              >
                Reemplazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
