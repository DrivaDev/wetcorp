import {
  Body, Container, Heading, Text, Button,
  Img, Html, Hr, Section, Row, Column,
} from '@react-email/components'

const ESTADO_LABELS: Record<string, string> = {
  borrador:    'Borrador',
  en_proceso:  'En proceso',
  en_transito: 'En tránsito',
  en_aduana:   'En aduana',
  entregada:   'Entregada',
  cancelada:   'Cancelada',
}

interface OCResumen {
  referenciaOC: string
  proveedor: string
  estado: string
  fechaOC: string
  notas: string
  paisOrigen?: string
  llegadaEstimada?: string
}

interface OCNotificationEmailProps {
  oc: OCResumen
  link: string
  isNew: boolean
}

const colors = {
  bg: '#f0f7ff',
  white: '#ffffff',
  principal: '#0061a6',
  titulares: '#004a80',
  acento: '#62b446',
  texto: '#1C1917',
  muted: '#6b7280',
  border: '#d1e8f5',
}

export function OCNotificationEmail({ oc, link, isNew }: OCNotificationEmailProps) {
  const estadoLabel = ESTADO_LABELS[oc.estado] ?? oc.estado

  return (
    <Html lang="es">
      <Body style={{ backgroundColor: colors.bg, fontFamily: 'Arial, sans-serif', margin: 0, padding: '32px 0' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden', border: `1px solid ${colors.border}` }}>

          {/* Header */}
          <Section style={{ backgroundColor: colors.white, padding: '24px 32px', borderBottom: `3px solid ${colors.principal}` }}>
            <Img
              src="https://wetcorp-comex.com.ar/logo-horizontal.svg"
              alt="Sistema integral COMEX"
              height={34}
              style={{ display: 'block' }}
            />
          </Section>

          {/* Title band */}
          <Section style={{ backgroundColor: colors.principal, padding: '16px 32px' }}>
            <Heading style={{ color: colors.white, fontSize: 18, fontWeight: 700, margin: 0 }}>
              {isNew ? `Nueva OC: ${oc.referenciaOC}` : `OC actualizada: ${oc.referenciaOC}`}
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ padding: '32px 32px 0' }}>

            {/* Notas — main element */}
            {oc.notas && (
              <Section style={{ backgroundColor: colors.bg, borderRadius: 8, padding: '16px 20px', marginBottom: 24, borderLeft: `4px solid ${colors.principal}` }}>
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                  Notas
                </Text>
                <Text style={{ color: colors.texto, fontSize: 15, lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {oc.notas}
                </Text>
              </Section>
            )}

            {/* OC data */}
            <Section style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
                Datos de la OC
              </Text>
              <Row style={{ marginBottom: 10 }}>
                <Column style={{ width: '50%' }}>
                  <Text style={{ color: colors.muted, fontSize: 12, margin: '0 0 2px' }}>Proveedor</Text>
                  <Text style={{ color: colors.texto, fontSize: 14, fontWeight: 600, margin: 0 }}>{oc.proveedor || '—'}</Text>
                </Column>
                <Column style={{ width: '50%' }}>
                  <Text style={{ color: colors.muted, fontSize: 12, margin: '0 0 2px' }}>Estado</Text>
                  <Text style={{ color: colors.principal, fontSize: 14, fontWeight: 600, margin: 0 }}>{estadoLabel}</Text>
                </Column>
              </Row>
              <Row style={{ marginBottom: 10 }}>
                <Column style={{ width: '50%' }}>
                  <Text style={{ color: colors.muted, fontSize: 12, margin: '0 0 2px' }}>Fecha OC</Text>
                  <Text style={{ color: colors.texto, fontSize: 14, fontWeight: 600, margin: 0 }}>{oc.fechaOC || '—'}</Text>
                </Column>
                {oc.llegadaEstimada && (
                  <Column style={{ width: '50%' }}>
                    <Text style={{ color: colors.muted, fontSize: 12, margin: '0 0 2px' }}>Llegada estimada</Text>
                    <Text style={{ color: colors.texto, fontSize: 14, fontWeight: 600, margin: 0 }}>{oc.llegadaEstimada}</Text>
                  </Column>
                )}
              </Row>
              {oc.paisOrigen && (
                <Row>
                  <Column>
                    <Text style={{ color: colors.muted, fontSize: 12, margin: '0 0 2px' }}>País de origen</Text>
                    <Text style={{ color: colors.texto, fontSize: 14, fontWeight: 600, margin: 0 }}>{oc.paisOrigen}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center', marginBottom: 32 }}>
              <Button
                href={link}
                style={{
                  backgroundColor: colors.principal,
                  color: colors.white,
                  borderRadius: 8,
                  padding: '14px 32px',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Ver OC en el sistema →
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={{ borderColor: colors.border, margin: 0 }} />
          <Section style={{ padding: '16px 32px' }}>
            <Text style={{ color: colors.muted, fontSize: 12, margin: 0, textAlign: 'center' }}>
              Sistema integral COMEX · Desarrollado por{' '}
              <a href="https://drivadev.com.ar" style={{ color: colors.acento, textDecoration: 'none' }}>Driva Dev</a>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
