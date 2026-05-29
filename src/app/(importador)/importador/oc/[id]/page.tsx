import { notFound } from 'next/navigation'
import { MOCK_OCS_DETALLE } from '@/lib/mock-ocs'
import { OCDetailHeader } from '@/components/oc-detail/OCDetailHeader'
import { OCDetailView } from '@/components/oc-detail/OCDetailView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OCDetailPage({ params }: PageProps) {
  const { id } = await params
  const oc = MOCK_OCS_DETALLE.find((o) => o.id === id)
  if (!oc) notFound()
  return (
    <div className="bg-fondo min-h-screen">
      <OCDetailHeader oc={oc} rol="importador" />
      <OCDetailView oc={oc} />
    </div>
  )
}
