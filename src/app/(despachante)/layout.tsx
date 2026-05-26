import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function DespachanteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar rol="despachante" />
      <main className="flex-1 bg-fondo">
        {children}
      </main>
      <Footer />
    </div>
  )
}
