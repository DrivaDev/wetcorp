import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        variables: {
          colorPrimary: '#0061a6',
          colorText: '#1C1917',
          colorBackground: '#FFFFFF',
          colorInputBackground: '#FFFFFF',
          colorInputText: '#1C1917',
          borderRadius: '0.5rem',
          fontFamily: 'var(--font-fira-sans), ui-sans-serif, system-ui',
          fontSize: '16px',
        },
      }}
    />
  )
}
