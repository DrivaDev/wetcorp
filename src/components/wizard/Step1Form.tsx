'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InfoGeneralState, ProductRow } from '@/lib/wizard-types'
import { isStep1Valid } from '@/lib/wizard-calculations'
import { PaisCombobox } from './PaisCombobox'
import { ProductosTable } from './ProductosTable'
import { createOC, updateOCInfo, checkReferenciaOC } from '@/actions/oc'

const inputClass =
  'w-full px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150'

const selectClass =
  'w-full px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer appearance-none'

const inputErrorClass =
  'w-full px-4 py-2 rounded-lg border border-red-500 bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-150'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim())
}

// Auto-format date input as DD/MM/AAAA while typing, clamping day ≤ 31 and month ≤ 12
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length === 0) return ''

  let dd = digits.slice(0, 2)
  if (digits.length >= 2) {
    const n = parseInt(dd, 10)
    if (n > 31) dd = '31'
    else if (n === 0) dd = '01'
  }
  if (digits.length <= 2) return dd

  const rawMm = digits.slice(2, 4)
  let mm = rawMm
  if (digits.length >= 4) {
    const n = parseInt(rawMm, 10)
    if (n > 12) mm = '12'
    else if (n === 0) mm = '01'
  }
  if (digits.length === 3) return `${dd}/${rawMm}`
  if (digits.length === 4) return `${dd}/${mm}`
  return `${dd}/${mm}/${digits.slice(4)}`
}

function isCompleteDate(v: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return false
  const [dd, mm] = v.split('/')
  const d = parseInt(dd, 10)
  const m = parseInt(mm, 10)
  return d >= 1 && d <= 31 && m >= 1 && m <= 12
}

const EMPTY_INFO: InfoGeneralState = {
  referenciaOC: '',
  estado: 'borrador',
  proveedor: '',
  emailsProveedor: [''],
  despacho: '',
  fechaDespacho: '',
  emailsDespachante: [''],
  paisOrigen: '',
  fechaOC: '',
  llegadaEstimada: '',
  fechaPago: '',
  tipoCambio: '',
  divisa: 'ARS/USD',
  notas: '',
}

interface Step1FormProps {
  initialData?: { info: InfoGeneralState; productos: ProductRow[] }
  ocId?: string
  rol?: string
}

export function Step1Form({ initialData, ocId, rol = 'importador' }: Step1FormProps = {}) {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [referenciaError, setReferenciaError] = useState<string | null>(null)

  const handleReferenciaBlur = async () => {
    const val = info.referenciaOC.trim()
    if (!val) return
    const { exists } = await checkReferenciaOC(val, ocId)
    setReferenciaError(exists ? 'Ya existe una OC con esta referencia' : null)
  }
  const [info, setInfo] = useState<InfoGeneralState>(initialData?.info ?? EMPTY_INFO)
  const [productos, setProductos] = useState<ProductRow[]>(
    initialData?.productos?.length
      ? initialData.productos
      : [{ id: crypto.randomUUID(), producto: '', descripcion: '', cantidad: '', valorUSD: '' }]
  )

  const addProducto = () =>
    setProductos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), producto: '', descripcion: '', cantidad: '', valorUSD: '' },
    ])
  const removeProducto = (id: string) =>
    setProductos((prev) => prev.filter((r) => r.id !== id))
  const updateProducto = (id: string, field: keyof Omit<ProductRow, 'id'>, value: string) =>
    setProductos((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))

  const setField = <K extends keyof InfoGeneralState>(key: K, value: InfoGeneralState[K]) =>
    setInfo((prev) => ({ ...prev, [key]: value }))

  // Multi-email helpers
  const addEmail = (field: 'emailsProveedor' | 'emailsDespachante') =>
    setInfo((prev) => ({ ...prev, [field]: [...prev[field], ''] }))
  const removeEmail = (field: 'emailsProveedor' | 'emailsDespachante', idx: number) =>
    setInfo((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }))
  const updateEmail = (
    field: 'emailsProveedor' | 'emailsDespachante',
    idx: number,
    value: string
  ) =>
    setInfo((prev) => ({
      ...prev,
      [field]: prev[field].map((v, i) => (i === idx ? value : v)),
    }))

  const handleContinuar = async () => {
    setSubmitted(true)
    if (!isStep1Valid(info, productos)) return
    setServerError(null)
    setIsLoading(true)

    if (ocId) {
      const result = await updateOCInfo(ocId, { info, productos })
      setIsLoading(false)
      if ('error' in result) {
        setServerError(result.error)
        return
      }
      router.push(`/${rol}/oc/${ocId}?step=2`)
      return
    }

    // Modo creación
    const result = await createOC({ info, productos })
    setIsLoading(false)
    if ('error' in result) {
      setServerError(result.error)
      return
    }
    router.push(`/importador/oc/${result.data.id}?step=2`) // createOC solo importador
  }

  const isValid = isStep1Valid(info, productos)

  const fieldError = (value: string) => submitted && value.trim() === ''
  const tipoCambioError = submitted && (info.tipoCambio === '' || Number(info.tipoCambio) <= 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-titulares">Paso 1: Información General</h1>

      {serverError && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm font-normal text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Referencia OC */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Referencia OC *</label>
          <input
            type="text"
            value={info.referenciaOC}
            placeholder="Ej: OC-2025-001"
            onChange={(e) => { setField('referenciaOC', e.target.value); setReferenciaError(null) }}
            onBlur={handleReferenciaBlur}
            className={(fieldError(info.referenciaOC) || !!referenciaError) ? inputErrorClass : inputClass}
          />
          {fieldError(info.referenciaOC) && (
            <p className="mt-1 text-xs text-red-600">Este campo es obligatorio</p>
          )}
          {referenciaError && (
            <p className="mt-1 text-xs text-red-600">{referenciaError}</p>
          )}
          {serverError && (
            <p className="mt-1 text-xs text-red-600">{serverError}</p>
          )}
        </div>

        {/* Estado */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Estado</label>
          <select
            value={info.estado}
            onChange={(e) => setField('estado', e.target.value as InfoGeneralState['estado'])}
            className={selectClass}
          >
            <option value="borrador">Borrador</option>
            <option value="en_proceso">En proceso</option>
            <option value="en_transito">En tránsito</option>
            <option value="en_aduana">En aduana</option>
            <option value="entregada">Entregada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {/* Proveedor */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Proveedor *</label>
          <input
            type="text"
            value={info.proveedor}
            placeholder="Nombre del proveedor"
            onChange={(e) => setField('proveedor', e.target.value)}
            className={fieldError(info.proveedor) ? inputErrorClass : inputClass}
          />
          {fieldError(info.proveedor) && (
            <p className="mt-1 text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        {/* Despacho */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Despacho</label>
          <input
            type="text"
            value={info.despacho}
            placeholder="Ej: 12345678/00"
            onChange={(e) => setField('despacho', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Fecha de despacho */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Fecha de despacho</label>
          <input
            type="text"
            value={info.fechaDespacho}
            placeholder="DD/MM/AAAA"
            maxLength={10}
            onChange={(e) => setField('fechaDespacho', formatDateInput(e.target.value))}
            className={inputClass}
          />
        </div>

        {/* Mails proveedor */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-normal text-texto">Mail proveedor *</label>
          <div className="flex flex-col gap-2">
            {info.emailsProveedor.map((email, idx) => {
              const emailInvalid =
                submitted && (email.trim() === '' || !isValidEmail(email))
              return (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="email"
                    value={email}
                    placeholder="proveedor@empresa.com"
                    onChange={(e) => updateEmail('emailsProveedor', idx, e.target.value)}
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg border bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 transition-colors duration-150',
                      emailInvalid
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-acento focus:ring-principal/30 focus:border-principal'
                    )}
                  />
                  {info.emailsProveedor.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail('emailsProveedor', idx)}
                      aria-label="Eliminar mail"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )
            })}
            {submitted && info.emailsProveedor.some((e) => e.trim() === '' || !isValidEmail(e)) && (
              <p className="text-xs text-red-600">
                {info.emailsProveedor[0]?.trim() === ''
                  ? 'Este campo es obligatorio'
                  : 'Ingresa un mail válido'}
              </p>
            )}
            <button
              type="button"
              onClick={() => addEmail('emailsProveedor')}
              className="flex items-center gap-1 text-sm font-normal text-principal hover:text-titulares transition-colors min-h-[44px] self-start"
            >
              <Plus size={14} />
              Agregar otro mail
            </button>
          </div>
        </div>

        {/* Mails despachante */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-normal text-texto">Mail despachante *</label>
          <div className="flex flex-col gap-2">
            {info.emailsDespachante.map((email, idx) => {
              const emailInvalid =
                submitted && (email.trim() === '' || !isValidEmail(email))
              return (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="email"
                    value={email}
                    placeholder="despachante@logistica.com"
                    onChange={(e) => updateEmail('emailsDespachante', idx, e.target.value)}
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg border bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 transition-colors duration-150',
                      emailInvalid
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-acento focus:ring-principal/30 focus:border-principal'
                    )}
                  />
                  {info.emailsDespachante.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail('emailsDespachante', idx)}
                      aria-label="Eliminar mail"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )
            })}
            {submitted && info.emailsDespachante.some((e) => e.trim() === '' || !isValidEmail(e)) && (
              <p className="text-xs text-red-600">
                {info.emailsDespachante[0]?.trim() === ''
                  ? 'Este campo es obligatorio'
                  : 'Ingresa un mail válido'}
              </p>
            )}
            <button
              type="button"
              onClick={() => addEmail('emailsDespachante')}
              className="flex items-center gap-1 text-sm font-normal text-principal hover:text-titulares transition-colors min-h-[44px] self-start"
            >
              <Plus size={14} />
              Agregar otro mail
            </button>
          </div>
        </div>

        {/* País de origen */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">País de origen *</label>
          <PaisCombobox
            value={info.paisOrigen}
            onChange={(v) => setField('paisOrigen', v)}
            hasError={fieldError(info.paisOrigen)}
          />
          {fieldError(info.paisOrigen) && (
            <p className="mt-1 text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        {/* Fecha OC */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Fecha OC *</label>
          <input
            type="text"
            value={info.fechaOC}
            placeholder="DD/MM/AAAA"
            maxLength={10}
            onChange={(e) => setField('fechaOC', formatDateInput(e.target.value))}
            className={submitted && !isCompleteDate(info.fechaOC) ? inputErrorClass : inputClass}
          />
          {submitted && !isCompleteDate(info.fechaOC) && (
            <p className="mt-1 text-xs text-red-600">
              {info.fechaOC === '' ? 'Este campo es obligatorio' : 'Formato: DD/MM/AAAA'}
            </p>
          )}
        </div>

        {/* Llegada estimada */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Llegada estimada</label>
          <input
            type="text"
            value={info.llegadaEstimada}
            placeholder="DD/MM/AAAA"
            maxLength={10}
            onChange={(e) => setField('llegadaEstimada', formatDateInput(e.target.value))}
            className={inputClass}
          />
        </div>

        {/* Fecha estimada de pago */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Fecha estimada de pago</label>
          <input
            type="text"
            value={info.fechaPago}
            placeholder="DD/MM/AAAA"
            maxLength={10}
            onChange={(e) => setField('fechaPago', formatDateInput(e.target.value))}
            className={inputClass}
          />
        </div>

        {/* Tipo de cambio */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Tipo de cambio *</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={info.tipoCambio}
              placeholder="Ej: 1200"
              min="0"
              step="any"
              onChange={(e) => setField('tipoCambio', e.target.value)}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg border bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 transition-colors duration-150',
                tipoCambioError
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-acento focus:ring-principal/30 focus:border-principal'
              )}
            />
            <select
              value={info.divisa}
              onChange={(e) => setField('divisa', e.target.value as InfoGeneralState['divisa'])}
              className="px-3 py-2 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer appearance-none"
            >
              <option value="ARS/USD">ARS/USD</option>
              <option value="ARS/EUR">ARS/EUR</option>
            </select>
          </div>
          {tipoCambioError && (
            <p className="mt-1 text-xs text-red-600">Ingresa un tipo de cambio válido</p>
          )}
        </div>

        {/* Notas */}
        <div className="flex flex-col gap-1 col-span-full sm:col-span-2">
          <label className="text-sm font-normal text-texto">Notas</label>
          <textarea
            value={info.notas}
            placeholder="Observaciones adicionales (opcional)"
            rows={3}
            onChange={(e) => setField('notas', e.target.value)}
            className={cn(inputClass, 'resize-none')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-titulares">Productos</h2>
        <ProductosTable
          productos={productos}
          tipoCambio={info.tipoCambio}
          fx={info.divisa === 'ARS/EUR' ? 'EUR' : 'USD'}
          onAdd={addProducto}
          onRemove={removeProducto}
          onChange={updateProducto}
        />
        {submitted &&
          productos.some(
            (r) => r.producto.trim() === '' || Number(r.cantidad) <= 0 || Number(r.valorUSD) < 0
          ) && (
            <p className="text-xs text-red-600">
              Completa todos los campos requeridos de los productos (nombre, cantidad mayor a 0 y valor).
            </p>
          )}
      </div>

      <div className="flex items-center justify-end mt-8 pt-6 border-t border-acento">
        <button
          type="button"
          onClick={handleContinuar}
          disabled={isLoading || (submitted && !isValid)}
          className={cn(
            'px-6 py-3 rounded-lg font-bold min-h-[44px] transition-colors',
            isValid && !isLoading
              ? 'bg-principal text-white hover:bg-titulares'
              : 'bg-principal/40 text-white/70 cursor-not-allowed'
          )}
        >
          {isLoading ? 'Guardando...' : 'Continuar a Paso 2'}
        </button>
      </div>
    </div>
  )
}
