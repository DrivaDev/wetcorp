import { getOCs } from '@/actions/oc'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function ProveedorDashboardPage() {
  const result = await getOCs()
  const { ocs, stats } =
    'error' in result
      ? { ocs: [], stats: { totales: 0, enTransito: 0, enAduana: 0, entregadas: 0 } }
      : result.data
  return <DashboardClient ocs={ocs} stats={stats} rol="proveedor" titulo="Mis Órdenes" />
}
