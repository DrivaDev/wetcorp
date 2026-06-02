import { notFound } from 'next/navigation'
import { getOCById } from '@/actions/oc'
import { OCDetailHeader } from '@/components/oc-detail/OCDetailHeader'
import { OCDetailView } from '@/components/oc-detail/OCDetailView'
import { WizardPage } from '@/components/wizard/WizardPage'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ step?: string }>
}

export default async function OCDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { step } = await searchParams

  const result = await getOCById(id)
  if ('error' in result) notFound()
  const oc = result.data.oc

  if (step === '2') {
    return <WizardPage initialStep="2" ocData={oc} ocId={id} />
  }

  return (
    <div className="bg-fondo min-h-screen">
      <OCDetailHeader oc={oc} rol="importador" />
      <OCDetailView oc={oc} />
    </div>
  )
}
