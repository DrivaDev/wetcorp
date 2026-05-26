'use client'
import type { EstadoOC } from '@/lib/mock-ocs'

type Rol = 'importador' | 'proveedor' | 'despachante'

interface FilterBarProps {
  rol: Rol
  onEstado: (estado: EstadoOC | '') => void
  onSearchProveedor?: (query: string) => void
  onSearchDespachante?: (query: string) => void
}

const inputClass =
  'w-full sm:w-56 px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150'

const selectClass =
  'w-full sm:w-48 px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer'

export function FilterBar({ rol, onEstado, onSearchProveedor, onSearchDespachante }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {rol === 'importador' && (
        <>
          <input
            type="text"
            placeholder="Buscar por proveedor..."
            className={inputClass}
            onChange={(e) => onSearchProveedor?.(e.target.value)}
          />
          <input
            type="text"
            placeholder="Buscar por despachante..."
            className={inputClass}
            onChange={(e) => onSearchDespachante?.(e.target.value)}
          />
        </>
      )}
      <select className={selectClass} onChange={(e) => onEstado(e.target.value as EstadoOC | '')}>
        <option value="">Todos los estados</option>
        <option value="borrador">Borrador</option>
        <option value="en_proceso">En proceso</option>
        <option value="en_transito">En tránsito</option>
        <option value="en_aduana">En aduana</option>
        <option value="entregada">Entregada</option>
        <option value="cancelada">Cancelada</option>
      </select>
    </div>
  )
}
