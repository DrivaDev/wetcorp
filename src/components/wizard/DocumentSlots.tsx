'use client'
import { useRef, useState } from 'react'
import { FileText, ExternalLink, Upload, Loader2, Trash2, Plus } from 'lucide-react'
import { updateOCDocumento, deleteOCDocumento, addOtroDocumento, deleteOtroDocumento } from '@/actions/oc'

const SLOTS: { nombre: string; key: string }[] = [
  { nombre: 'Factura proveedor',      key: 'facturaProveedor' },
  { nombre: 'Factura despachante',    key: 'facturaDespachante' },
  { nombre: 'B/L',                    key: 'conocimientoEmbarque' },
  { nombre: 'Certificado de Origen',  key: 'certificadoOrigen' },
  { nombre: 'Certificado de Análisis',key: 'certificadoAnalisis' },
  { nombre: 'Packing list',           key: 'packingList' },
  { nombre: 'Hoja de seguridad',      key: 'hojaSeguridad' },
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
    hojaSeguridad?: string | null
    otro: string | null
  }
  otrosDocumentos?: { url: string; slot: string }[]
}

export function DocumentSlots({ readOnly, ocId, documentos, otrosDocumentos }: DocumentSlotsProps = {}) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploadingOtro, setUploadingOtro] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localUrls, setLocalUrls] = useState<Record<string, string | null>>({})
  const [localOtros, setLocalOtros] = useState<{ url: string; slot: string }[]>(otrosDocumentos ?? [])
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const otroInputRef = useRef<HTMLInputElement | null>(null)

  const getUrl = (key: string): string | null => {
    if (key in localUrls) return localUrls[key]
    return (documentos?.[key as keyof typeof documentos] as string | null) ?? null
  }

  const handleDelete = async (key: string) => {
    if (!ocId) return
    setError(null)
    setDeleting(key)
    try {
      const result = await deleteOCDocumento(ocId, key)
      if ('error' in result) { setError(result.error); return }
      setLocalUrls(prev => ({ ...prev, [key]: null }))
    } catch {
      setError('Error de conexión al eliminar el archivo')
    } finally {
      setDeleting(null)
    }
  }

  const handleFileChange = async (key: string, file: File | null) => {
    if (!file || !ocId) return
    setError(null)
    setUploading(key)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('ocId', ocId)
      formData.append('slot', key)
      const res = await fetch('/api/upload-doc', { method: 'POST', body: formData })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) { setError(json.error ?? 'Error al subir el archivo'); return }
      const result = await updateOCDocumento(ocId, key, json.url)
      if ('error' in result) { setError(result.error); return }
      setLocalUrls(prev => ({ ...prev, [key]: json.url! }))
    } catch {
      setError('Error de conexión al subir el archivo')
    } finally {
      setUploading(null)
      if (inputRefs.current[key]) inputRefs.current[key]!.value = ''
    }
  }

  const handleOtroUpload = async (file: File | null) => {
    if (!file || !ocId) return
    setError(null)
    setUploadingOtro(true)
    const nextSlot = `otro-${localOtros.length + 1}`
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('ocId', ocId)
      formData.append('slot', nextSlot)
      const res = await fetch('/api/upload-doc', { method: 'POST', body: formData })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) { setError(json.error ?? 'Error al subir el archivo'); return }
      const result = await addOtroDocumento(ocId, json.url, nextSlot)
      if ('error' in result) { setError(result.error); return }
      setLocalOtros(prev => [...prev, { url: json.url!, slot: nextSlot }])
    } catch {
      setError('Error de conexión al subir el archivo')
    } finally {
      setUploadingOtro(false)
      if (otroInputRef.current) otroInputRef.current.value = ''
    }
  }

  const handleDeleteOtro = async (slot: string) => {
    if (!ocId) return
    setError(null)
    setDeleting(slot)
    try {
      const result = await deleteOtroDocumento(ocId, slot)
      if ('error' in result) { setError(result.error); return }
      setLocalOtros(prev => prev.filter(o => o.slot !== slot))
    } catch {
      setError('Error de conexión al eliminar el archivo')
    } finally {
      setDeleting(null)
    }
  }

  const btnView = (url: string) => (
    <a
      href={`/api/download-doc?url=${encodeURIComponent(url)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm font-normal text-principal hover:text-titulares border border-principal/40 hover:border-principal rounded-lg px-3 py-1.5 transition-colors min-h-[36px] shrink-0"
    >
      <ExternalLink size={14} />
      Ver archivo
    </a>
  )

  const btnDelete = (key: string, onDelete: () => void) => {
    const isDel = deleting === key
    return (
      <button
        type="button"
        disabled={isDel || uploading === key}
        onClick={onDelete}
        className="flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-400 rounded-lg p-1.5 transition-colors min-h-[36px] min-w-[36px] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Eliminar archivo"
      >
        {isDel ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    )
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
        {/* Fixed slots */}
        {SLOTS.map(({ nombre, key }) => {
          const url = getUrl(key)
          const isUploading = uploading === key

          return (
            <div key={key} className="flex items-center gap-3 px-4 py-3">
              <FileText size={18} className="text-acento shrink-0" />
              <span className="flex-1 text-base font-normal text-texto">{nombre}</span>

              {readOnly ? (
                url ? btnView(url) : <span className="text-sm font-normal text-texto/40 shrink-0">Sin archivo</span>
              ) : (
                <>
                  {url && btnView(url)}
                  {url && btnDelete(key, () => handleDelete(key))}
                  {!url && <span className="text-sm font-normal text-texto/50 hidden sm:block shrink-0">Sin archivo</span>}
                  <input
                    ref={el => { inputRefs.current[key] = el }}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => handleFileChange(key, e.target.files?.[0] ?? null)}
                    disabled={isUploading || deleting === key}
                  />
                  <button
                    type="button"
                    disabled={isUploading || deleting === key}
                    onClick={() => inputRefs.current[key]?.click()}
                    className="flex items-center gap-1.5 text-sm font-normal text-principal hover:text-titulares border border-principal/40 hover:border-principal rounded-lg px-3 py-1.5 transition-colors min-h-[36px] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading
                      ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
                      : <><Upload size={14} /> {url ? 'Cambiar' : 'Adjuntar'}</>}
                  </button>
                </>
              )}
            </div>
          )
        })}

        {/* Otros documentos dinámicos */}
        {localOtros.map((otro, i) => (
          <div key={otro.slot} className="flex items-center gap-3 px-4 py-3">
            <FileText size={18} className="text-acento shrink-0" />
            <span className="flex-1 text-base font-normal text-texto">Otro {i + 1}</span>

            {readOnly ? (
              btnView(otro.url)
            ) : (
              <>
                {btnView(otro.url)}
                {btnDelete(otro.slot, () => handleDeleteOtro(otro.slot))}
              </>
            )}
          </div>
        ))}

        {/* Agregar otro documento */}
        {!readOnly && (
          <div className="flex items-center gap-3 px-4 py-3">
            <FileText size={18} className="text-acento/40 shrink-0" />
            <span className="flex-1 text-sm font-normal text-texto/50">Agregar otro documento</span>
            <input
              ref={otroInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => handleOtroUpload(e.target.files?.[0] ?? null)}
              disabled={uploadingOtro}
            />
            <button
              type="button"
              disabled={uploadingOtro}
              onClick={() => otroInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm font-normal text-principal hover:text-titulares border border-principal/40 hover:border-principal rounded-lg px-3 py-1.5 transition-colors min-h-[36px] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingOtro
                ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
                : <><Plus size={14} /> Agregar</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
