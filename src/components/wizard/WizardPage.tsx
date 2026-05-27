'use client'
import { Step1Form } from './Step1Form'
import { Step2Form } from './Step2Form'

interface WizardPageProps {
  initialStep: string
}

export function WizardPage({ initialStep }: WizardPageProps) {
  if (initialStep === '2') {
    return <Step2Form />
  }
  return <Step1Form />
}
