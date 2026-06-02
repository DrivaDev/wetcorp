import type { Metadata } from 'next'
import { Fira_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-fira-sans',
})

export const metadata: Metadata = {
  title: 'Sistema integral COMEX',
  description: 'Sistema de gestión de órdenes de compra para importadores',
  icons: {
    icon: '/isotipo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <html lang="es" className={firaSans.variable}>
        <body className="bg-fondo text-texto font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
