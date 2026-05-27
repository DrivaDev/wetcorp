'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { InfoGeneralState, ProductRow, Step1Data } from '@/lib/wizard-types'
import { isStep1Valid } from '@/lib/wizard-calculations'
import { ProductosTable } from './ProductosTable'

const inputClass =
  'w-full px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150'

const selectClass =
  'w-full px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer appearance-none'

const inputErrorClass =
  'w-full px-4 py-2 rounded-lg border border-red-500 bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-150'

export function Step1Form() {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)

  const [info, setInfo] = useState<InfoGeneralState>({
    referenciaOC: '',
    estado: 'borrador',
    proveedor: '',
    emailProveedor: '',
    emailDespachante: '',
    paisOrigen: '',
    fechaOC: '',
    llegadaEstimada: '',
    tipoCambio: '',
    divisa: 'ARS/USD',
    notas: '',
  })

  const [productos, setProductos] = useState<ProductRow[]>([
    {
      id: crypto.randomUUID(),
      producto: '',
      descripcion: '',
      cantidad: '',
      valorUSD: '',
    },
  ])

  useEffect(() => {
    const raw = sessionStorage.getItem('oc-step1-draft')
    if (!raw) return
    try {
      const data: Step1Data = JSON.parse(raw)
      setInfo(data.info)
      setProductos(data.productos)
    } catch {
      // JSON inválido — ignorar y arrancar con estado vacío
    }
  }, [])

  const addProducto = () =>
    setProductos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        producto: '',
        descripcion: '',
        cantidad: '',
        valorUSD: '',
      },
    ])

  const removeProducto = (id: string) =>
    setProductos((prev) => prev.filter((r) => r.id !== id))

  const updateProducto = (
    id: string,
    field: keyof Omit<ProductRow, 'id'>,
    value: string
  ) =>
    setProductos((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )

  const handleContinuar = () => {
    setSubmitted(true)
    if (!isStep1Valid(info, productos)) return
    const step1Data: Step1Data = { info, productos }
    sessionStorage.setItem('oc-step1-draft', JSON.stringify(step1Data))
    router.push('/importador/oc/nueva?step=2')
  }

  const isValid = isStep1Valid(info, productos)

  const fieldError = (value: string) =>
    submitted && value.trim() === ''

  const tipoCambioError =
    submitted &&
    (info.tipoCambio === '' || Number(info.tipoCambio) <= 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-titulares">
        Paso 1: Información General
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">
            Referencia OC *
          </label>
          <input
            type="text"
            value={info.referenciaOC}
            placeholder="Ej: OC-2025-001"
            onChange={(e) => setInfo((prev) => ({ ...prev, referenciaOC: e.target.value }))}
            className={fieldError(info.referenciaOC) ? inputErrorClass : inputClass}
          />
          {fieldError(info.referenciaOC) && (
            <p className="mt-1 text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Estado</label>
          <select
            value={info.estado}
            onChange={(e) =>
              setInfo((prev) => ({
                ...prev,
                estado: e.target.value as InfoGeneralState['estado'],
              }))
            }
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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Proveedor *</label>
          <input
            type="text"
            value={info.proveedor}
            placeholder="Nombre del proveedor"
            onChange={(e) => setInfo((prev) => ({ ...prev, proveedor: e.target.value }))}
            className={fieldError(info.proveedor) ? inputErrorClass : inputClass}
          />
          {fieldError(info.proveedor) && (
            <p className="mt-1 text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Mail proveedor *</label>
          <input
            type="email"
            value={info.emailProveedor}
            placeholder="proveedor@empresa.com"
            onChange={(e) => setInfo((prev) => ({ ...prev, emailProveedor: e.target.value }))}
            className={fieldError(info.emailProveedor) ? inputErrorClass : inputClass}
          />
          {fieldError(info.emailProveedor) && (
            <p className="mt-1 text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Mail despachante *</label>
          <input
            type="email"
            value={info.emailDespachante}
            placeholder="despachante@logistica.com"
            onChange={(e) =>
              setInfo((prev) => ({ ...prev, emailDespachante: e.target.value }))
            }
            className={fieldError(info.emailDespachante) ? inputErrorClass : inputClass}
          />
          {fieldError(info.emailDespachante) && (
            <p className="mt-1 text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">País de origen *</label>
          <input
            type="text"
            value={info.paisOrigen}
            placeholder="Ej: China"
            onChange={(e) => setInfo((prev) => ({ ...prev, paisOrigen: e.target.value }))}
            className={fieldError(info.paisOrigen) ? inputErrorClass : inputClass}
          />
          {fieldError(info.paisOrigen) && (
            <p className="mt-1 text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Fecha OC *</label>
          <input
            type="date"
            value={info.fechaOC}
            onChange={(e) => setInfo((prev) => ({ ...prev, fechaOC: e.target.value }))}
            className={
              submitted && info.fechaOC === '' ? inputErrorClass : inputClass
            }
          />
          {submitted && info.fechaOC === '' && (
            <p className="mt-1 text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">Llegada estimada</label>
          <input
            type="date"
            value={info.llegadaEstimada}
            onChange={(e) =>
              setInfo((prev) => ({ ...prev, llegadaEstimada: e.target.value }))
            }
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-normal text-texto">
            Tipo de cambio *
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={info.tipoCambio}
              placeholder="Ej: 1200"
              min="0"
              step="any"
              onChange={(e) =>
                setInfo((prev) => ({ ...prev, tipoCambio: e.target.value }))
              }
              className={cn(
                'flex-1 px-4 py-2 rounded-lg border bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 transition-colors duration-150',
                tipoCambioError
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-acento focus:ring-principal/30 focus:border-principal'
              )}
            />
            <select
              value={info.divisa}
              onChange={(e) =>
                setInfo((prev) => ({
                  ...prev,
                  divisa: e.target.value as InfoGeneralState['divisa'],
                }))
              }
              className="px-3 py-2 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer appearance-none"
            >
              <option value="ARS/USD">ARS/USD</option>
              <option value="ARS/EUR">ARS/EUR</option>
            </select>
          </div>
          {tipoCambioError && (
            <p className="mt-1 text-xs text-red-600">
              Ingresa un tipo de cambio válido
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 col-span-full sm:col-span-2">
          <label className="text-sm font-normal text-texto">Notas</label>
          <textarea
            value={info.notas}
            placeholder="Observaciones adicionales (opcional)"
            rows={3}
            onChange={(e) => setInfo((prev) => ({ ...prev, notas: e.target.value }))}
            className={cn(inputClass, 'resize-none')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-titulares">Productos</h2>
        <ProductosTable
          productos={productos}
          tipoCambio={info.tipoCambio}
          onAdd={addProducto}
          onRemove={removeProducto}
          onChange={updateProducto}
        />
        {submitted && productos.some(
          (r) =>
            r.producto.trim() === '' ||
            Number(r.cantidad) <= 0 ||
            Number(r.valorUSD) < 0
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
          disabled={submitted && !isValid}
          className={cn(
            'px-6 py-3 rounded-lg font-bold min-h-[44px] transition-colors',
            isValid
              ? 'bg-principal text-white hover:bg-titulares'
              : 'bg-principal/40 text-white/70 cursor-not-allowed'
          )}
        >
          Continuar a Paso 2
        </button>
      </div>
    </div>
  )
}
