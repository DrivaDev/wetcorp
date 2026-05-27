import { WizardPage } from '@/components/wizard/WizardPage'

interface PageProps {
  searchParams: Promise<{ step?: string }>
}

export default async function NuevaOCPage({ searchParams }: PageProps) {
  const { step } = await searchParams
  return <WizardPage initialStep={step ?? '1'} />
}
