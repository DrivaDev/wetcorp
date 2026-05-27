'use client'

interface WizardPageProps {
  initialStep: string
}

export function WizardPage({ initialStep }: WizardPageProps) {
  return <div>Step {initialStep}</div>
}
