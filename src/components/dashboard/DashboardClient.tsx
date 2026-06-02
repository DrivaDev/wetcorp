'use client'

import { useState } from 'react'
import { FileText, Truck, Package, CheckCircle2 } from 'lucide-react'
import type { OC, EstadoOC } from '@/lib/mock-ocs'
import { StatCard } from '@/components/dashboard/StatCard'
import { OCTable } from '@/components/dashboard/OCTable'
import { FilterBar } from '@/components/dashboard/FilterBar'

interface DashboardStats {
  totales: number
  enTransito: number
  enAduana: number
  entregadas: number
}

interface DashboardClientProps {
  ocs: OC[]
  stats: DashboardStats
  rol: 'importador' | 'proveedor' | 'despachante'
  titulo: string
}

export function DashboardClient({ ocs, stats, rol, titulo }: DashboardClientProps) {
  const [searchProveedor, setSearchProveedor] = useState('')
  const [searchDespachante, setSearchDespachante] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoOC | ''>('')

  const ocsFiltradas = ocs.filter((oc) => {
    const matchProveedor =
      rol === 'importador'
        ? oc.proveedor.toLowerCase().includes(searchProveedor.toLowerCase())
        : true
    const matchDespachante =
      rol === 'importador'
        ? oc.despachante.toLowerCase().includes(searchDespachante.toLowerCase())
        : true
    const matchEstado = estadoFiltro === '' || oc.estado === estadoFiltro
    return matchProveedor && matchDespachante && matchEstado
  })

  const hasFilters =
    searchProveedor !== '' || searchDespachante !== '' || estadoFiltro !== ''

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-bold text-titulares mb-6">{titulo}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} value={stats.totales} label="OC Totales" />
        <StatCard icon={Truck} value={stats.enTransito} label="En tránsito" />
        <StatCard icon={Package} value={stats.enAduana} label="En aduana" />
        <StatCard icon={CheckCircle2} value={stats.entregadas} label="Entregadas" />
      </div>
      <FilterBar
        rol={rol}
        onEstado={setEstadoFiltro}
        onSearchProveedor={rol === 'importador' ? setSearchProveedor : undefined}
        onSearchDespachante={rol === 'importador' ? setSearchDespachante : undefined}
      />
      <OCTable ocs={ocsFiltradas} rol={rol} hasFilters={hasFilters} />
    </div>
  )
}
