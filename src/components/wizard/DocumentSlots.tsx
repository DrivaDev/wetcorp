'use client'
import { useRef, useState } from 'react'
import { FileText, ExternalLink, Upload, Loader2 } from 'lucide-react'
import { updateOCDocumento } from '@/actions/oc'

const SLOTS: { nombre: string; key: string }[] = [
  { nombre: 'Factura proveedor',      key: 'facturaProveedor' },
  { nombre: 'Factura despachante',    key: 'facturaDespachante' },
  { nombre: 'B/L',                    key: 'conocimientoEmbarque' },
  { nombre: 'Certificado de Origen',  key: 'certificadoOrigen' },
  { nombre: 'Certificado de Análisis',key: 'certificadoAnalisis' },
  { nombre: 'Packing list',           key: 'packingList' },
  { nombre: 'Otro',                   key: 'otro' },
]

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

export function DocumentSlots({ readOnly, ocId, documentos }: DocumentSlotsProps = {}) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localUrls, setLocalUrls] = useState<Record<string, string>>({})
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const getUrl = (key: string): string | null =>
    localUrls[key] ?? (documentos?.[key as keyof typeof documentos] as string | null) ?? null

  const handleFileChange = async (key: string, file: File | null) => {
    if (!file || !ocId) return
    setError(null)
    setUploading(key)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-doc', { method: 'POST', body: formData })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) {
        setError(json.error ?? 'Error al subir el archivo')
        return
      }
      const result = await updateOCDocumento(ocId, key, json.url)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setLocalUrls(prev => ({ ...prev, [key]: json.url! }))
    } catch {
      setError('Error de conexión al subir el archivo')
    } finally {
      setUploading(null)
      if (inputRefs.current[key]) inputRefs.current[key]!.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-bold text-titulares">Documentos</h2>
        <p className="text-sm font-normal text-texto/60 mt-0.5">Solo se aceptan archivos PDF (máx. 10 MB)</p>
      </div>

      {error && (
        <p className="text-sm font-normal text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-acento bg-white divide-y divide-acento/40 overflow-hidden">
        {SLOTS.map(({ nombre, key }) => {
          const url = getUrl(key)
          const isUploading = uploading === key

          return (
            <div key={key} className="flex items-center gap-3 px-4 py-3">
              <FileText size={18} className="text-acento shrink-0" />
              <span className="flex-1 text-base font-normal text-texto">{nombre}</span>

              {readOnly ? (
                url ? (
                  <a
                    href={url}
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
                  <span className="text-sm font-normal text-texto/50 hidden sm:block shrink-0 max-w-[160px] truncate">
                    {url ? 'Archivo adjunto' : 'Sin archivo'}
                  </span>

                  <input
                    ref={el => { inputRefs.current[key] = el }}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => handleFileChange(key, e.target.files?.[0] ?? null)}
                    disabled={isUploading}
                  />

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => inputRefs.current[key]?.click()}
                    className="flex items-center gap-1.5 text-sm font-normal text-principal hover:text-titulares border border-principal/40 hover:border-principal rounded-lg px-3 py-1.5 transition-colors min-h-[36px] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
                    ) : (
                      <><Upload size={14} /> {url ? 'Cambiar' : 'Adjuntar'}</>
                    )}
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
