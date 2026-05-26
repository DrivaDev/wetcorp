'use client'
import { useState } from 'react'
import { FileText, Truck, Package, CheckCircle2 } from 'lucide-react'
import { MOCK_OCS } from '@/lib/mock-ocs'
import type { EstadoOC } from '@/lib/mock-ocs'
import { StatCard } from '@/components/dashboard/StatCard'
import { OCTable } from '@/components/dashboard/OCTable'
import { FilterBar } from '@/components/dashboard/FilterBar'

export default function DespachanteDashboardPage() {
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoOC | ''>('')

  const ocsDelDespachante = MOCK_OCS.filter((oc) => oc.emailDespachante === 'despachante@logistica.com')

  const ocsFiltradas = ocsDelDespachante.filter((oc) => {
    return estadoFiltro === '' || oc.estado === estadoFiltro
  })

  const stats = {
    totales: ocsDelDespachante.length,
    enTransito: ocsDelDespachante.filter((oc) => oc.estado === 'en_transito').length,
    enAduana: ocsDelDespachante.filter((oc) => oc.estado === 'en_aduana').length,
    entregadas: ocsDelDespachante.filter((oc) => oc.estado === 'entregada').length,
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-bold text-titulares mb-6">Mis Órdenes</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} value={stats.totales} label="OC Totales" />
        <StatCard icon={Truck} value={stats.enTransito} label="En tránsito" />
        <StatCard icon={Package} value={stats.enAduana} label="En aduana" />
        <StatCard icon={CheckCircle2} value={stats.entregadas} label="Entregadas" />
      </div>
      <FilterBar rol="despachante" onEstado={setEstadoFiltro} />
      <OCTable ocs={ocsFiltradas} rol="despachante" hasFilters={estadoFiltro !== ''} />
    </div>
  )
}
