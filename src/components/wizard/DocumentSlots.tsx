import { Upload } from 'lucide-react'

const DOCUMENT_SLOTS = [
  'Factura proveedor',
  'Factura despachante',
  'Conocimiento de embarque',
  'Certificado de Origen',
  'Otro documento',
]

export function DocumentSlots() {
  return (
    <div>
      <p className="text-base font-bold text-titulares mb-4">Documentos</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOCUMENT_SLOTS.map((nombre) => (
          <div
            key={nombre}
            className="rounded-xl border-2 border-dashed border-acento bg-white p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]"
          >
            <Upload size={32} className="text-acento" />
            <p className="text-sm font-normal text-titulares text-center">{nombre}</p>
            <p className="text-sm font-normal text-texto/60 text-center">Sin archivo adjunto</p>
          </div>
        ))}
      </div>
    </div>
  )
}
