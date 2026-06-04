import { redirect } from 'next/navigation'
import { getOCById } from '@/actions/oc'
import { WizardPage } from '@/components/wizard/WizardPage'

interface Props {
  ocId: string
  rol: string
}

export async function EditWizardLoader({ ocId, rol }: Props) {
  const result = await getOCById(ocId)
  if ('error' in result) redirect(`/${rol}/dashboard`)
  return <WizardPage initialStep="2" ocData={result.data.oc} ocId={ocId} rol={rol} />
}
