import { notFound } from 'next/navigation'
import { getOCById } from '@/actions/oc'
import { OCDetailHeader } from '@/components/oc-detail/OCDetailHeader'
import { OCDetailView } from '@/components/oc-detail/OCDetailView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OCDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getOCById(id)
  if ('error' in result) notFound()
  return (
    <div className="bg-fondo min-h-screen">
      <OCDetailHeader oc={result.data.oc} rol="despachante" />
      <OCDetailView oc={result.data.oc} />
    </div>
  )
}
