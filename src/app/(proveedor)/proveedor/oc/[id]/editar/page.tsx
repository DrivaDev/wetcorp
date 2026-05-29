import { EditWizardLoader } from './EditWizardLoader'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarOCPage({ params }: PageProps) {
  const { id } = await params
  return <EditWizardLoader ocId={id} rol="proveedor" />
}
