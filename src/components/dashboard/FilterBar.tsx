'use client'
import type { EstadoOC } from '@/lib/mock-ocs'

interface FilterBarProps {
  onSearch: (query: string) => void
  onEstado: (estado: EstadoOC | '') => void
}

export function FilterBar({ onSearch, onEstado }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <input
        type="text"
        placeholder="Buscar por proveedor..."
        className="w-full sm:w-64 px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150"
        onChange={(e) => onSearch(e.target.value)}
      />
      <select
        className="w-full sm:w-48 px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer"
        onChange={(e) => onEstado(e.target.value as EstadoOC | '')}
      >
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
