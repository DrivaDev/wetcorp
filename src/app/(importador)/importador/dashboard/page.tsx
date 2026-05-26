'use client'
import { useState } from 'react'
import { FileText, Truck, Package, CheckCircle2 } from 'lucide-react'
import { MOCK_OCS } from '@/lib/mock-ocs'
import type { EstadoOC } from '@/lib/mock-ocs'
import { StatCard } from '@/components/dashboard/StatCard'
import { OCTable } from '@/components/dashboard/OCTable'
import { FilterBar } from '@/components/dashboard/FilterBar'

export default function ImportadorDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoOC | ''>('')

  const todasLasOCs = MOCK_OCS

  const ocsFiltradas = todasLasOCs.filter((oc) => {
    const matchProveedor = oc.proveedor.toLowerCase().includes(searchQuery.toLowerCase())
    const matchEstado = estadoFiltro === '' || oc.estado === estadoFiltro
    return matchProveedor && matchEstado
  })

  const stats = {
    totales: todasLasOCs.length,
    enTransito: todasLasOCs.filter((oc) => oc.estado === 'en_transito').length,
    enAduana: todasLasOCs.filter((oc) => oc.estado === 'en_aduana').length,
    entregadas: todasLasOCs.filter((oc) => oc.estado === 'entregada').length,
  }

  const hasFilters = searchQuery !== '' || estadoFiltro !== ''

  return (
    <div className="p-6 bg-fondo min-h-screen">
      <h1 className="text-xl font-bold text-titulares mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} value={stats.totales} label="OC Totales" />
        <StatCard icon={Truck} value={stats.enTransito} label="En tránsito" />
        <StatCard icon={Package} value={stats.enAduana} label="En aduana" />
        <StatCard icon={CheckCircle2} value={stats.entregadas} label="Entregadas" />
      </div>
      <FilterBar onSearch={setSearchQuery} onEstado={setEstadoFiltro} />
      <OCTable ocs={ocsFiltradas} rol="importador" hasFilters={hasFilters} />
    </div>
  )
}
