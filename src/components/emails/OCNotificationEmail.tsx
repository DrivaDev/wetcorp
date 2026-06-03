import { Body, Container, Heading, Text, Button, Img, Html, Hr } from '@react-email/components'

interface OCResumen {
  referenciaOC: string
  proveedor: string
  estado: string
  fechaOC: string
  notas: string
}

interface OCNotificationEmailProps {
  oc: OCResumen
  link: string
}

export function OCNotificationEmail({ oc, link }: OCNotificationEmailProps) {
  return (
    <Html lang="es">
      <Body style={{ backgroundColor: '#f0f7ff', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '32px auto', backgroundColor: '#ffffff', borderRadius: 8, padding: 32, border: '1px solid #e5e7eb' }}>
          <Img
            src="https://sistema-comex.vercel.app/logo-horizontal.svg"
            alt="Sistema integral COMEX"
            height={36}
            style={{ marginBottom: 24 }}
          />
          <Hr style={{ borderColor: '#0061a6', marginBottom: 24 }} />
          <Heading style={{ color: '#004a80', fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>
            Actualización: OC {oc.referenciaOC}
          </Heading>
          <Text style={{ color: '#1C1917', fontSize: 14, margin: '0 0 8px' }}>
            <strong>Proveedor:</strong> {oc.proveedor}
          </Text>
          <Text style={{ color: '#1C1917', fontSize: 14, margin: '0 0 8px' }}>
            <strong>Estado:</strong> {oc.estado}
          </Text>
          <Text style={{ color: '#1C1917', fontSize: 14, margin: '0 0 8px' }}>
            <strong>Fecha OC:</strong> {oc.fechaOC}
          </Text>
          {oc.notas && (
            <Text style={{ color: '#1C1917', fontSize: 14, margin: '0 0 16px' }}>
              <strong>Notas:</strong> {oc.notas}
            </Text>
          )}
          <Button
            href={link}
            style={{
              backgroundColor: '#0061a6',
              color: '#ffffff',
              borderRadius: 6,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Ver OC en el sistema
          </Button>
          <Hr style={{ borderColor: '#e5e7eb', marginTop: 32, marginBottom: 16 }} />
          <Text style={{ color: '#1C1917', fontSize: 12, margin: 0 }}>
            Sistema integral COMEX — Desarrollado por{' '}
            <a href="https://drivadev.com.ar" style={{ color: '#62b446' }}>Driva Dev</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
