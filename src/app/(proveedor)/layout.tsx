import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function ProveedorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar rol="proveedor" />
      <main className="flex-1 bg-fondo">
        {children}
      </main>
      <Footer />
    </div>
  )
}
