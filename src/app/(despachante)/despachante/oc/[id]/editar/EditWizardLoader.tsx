import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

interface Props {
  ocId: string
  rol: string
}

export async function EditWizardLoader({ ocId, rol }: Props): Promise<ReactNode> {
  redirect(`/${rol}/oc/${ocId}`)
}
