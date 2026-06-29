import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import {
  calcFOBTotal,
  calcTotalGastos,
  calcLandedCost,
} from '@/lib/wizard-calculations'
import type { SerializedOC } from '@/actions/oc'

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 32, fontFamily: 'Helvetica', fontSize: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #0061a6' },
  headerTitle: { fontSize: 18, color: '#004a80', fontWeight: 'bold' },
  headerSub: { fontSize: 9, color: '#666666', marginTop: 2 },
  sectionTitle: { fontSize: 11, color: '#0061a6', fontWeight: 'bold', marginBottom: 6, marginTop: 16, paddingBottom: 4, borderBottom: '1px solid #e5e7eb' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { fontSize: 9, color: '#666666', width: 140 },
  value: { fontSize: 9, color: '#1C1917', flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0061a6', padding: '5 4', marginBottom: 2 },
  tableHeaderCell: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', padding: '4 4', borderBottom: '1px solid #f3f4f6' },
  tableCell: { fontSize: 8, color: '#1C1917' },
  valueCard: { backgroundColor: '#f0f7ff', borderRadius: 6, padding: '8 12', marginRight: 8, flex: 1 },
  valueCardLabel: { fontSize: 8, color: '#666666', marginBottom: 2 },
  valueCardAmount: { fontSize: 12, color: '#0061a6', fontWeight: 'bold' },
  valueCardsRow: { flexDirection: 'row', marginTop: 16 },
  footer: { marginTop: 24, paddingTop: 12, borderTop: '1px solid #e5e7eb' },
  footerText: { fontSize: 8, color: '#999999' },
})

interface OCPDFDocumentProps {
  oc: SerializedOC
}

export function OCPDFDocument({ oc }: OCPDFDocumentProps) {
  const tc = oc.tipoCambio ?? '0'
  const fob = calcFOBTotal(oc.productos)
  const gastos = calcTotalGastos(
    oc.gastosDespacho,
    oc.gastosDespachante,
    oc.gastosAdicionales,
    oc.otrosGastos,
    tc
  )
  const landed = calcLandedCost(fob, gastos)

  return (
    <Document title={`OC ${oc.referenciaOC}`} author="Sistema integral COMEX">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>OC {oc.referenciaOC}</Text>
            <Text style={styles.headerSub}>Sistema integral COMEX</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: '#62b446', fontWeight: 'bold' }}>{oc.estado.toUpperCase()}</Text>
          </View>
        </View>

        {/* Info General */}
        <Text style={styles.sectionTitle}>Información General</Text>
        <View style={styles.row}><Text style={styles.label}>Proveedor:</Text><Text style={styles.value}>{oc.proveedor}</Text></View>
        <View style={styles.row}><Text style={styles.label}>País de Origen:</Text><Text style={styles.value}>{oc.paisOrigen}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Fecha OC:</Text><Text style={styles.value}>{oc.fechaOC}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Llegada Estimada:</Text><Text style={styles.value}>{oc.llegadaEstimada}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Tipo de Cambio:</Text><Text style={styles.value}>{oc.tipoCambio} ({oc.divisa})</Text></View>
        {oc.notas ? <View style={styles.row}><Text style={styles.label}>Notas:</Text><Text style={styles.value}>{oc.notas}</Text></View> : null}

        {/* Productos */}
        <Text style={styles.sectionTitle}>Productos</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Producto</Text>
          <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Descripción</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Cantidad</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'right' }]}>V. Unit USD</Text>
          <Text style={[styles.tableHeaderCell, { width: '13%', textAlign: 'right' }]}>Total USD</Text>
        </View>
        {oc.productos.map((p, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '30%' }]}>{p.producto}</Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>{p.descripcion}</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{p.cantidad}</Text>
            <Text style={[styles.tableCell, { width: '12%', textAlign: 'right' }]}>{p.valorUSD}</Text>
            <Text style={[styles.tableCell, { width: '13%', textAlign: 'right' }]}>
              {(parseFloat(p.cantidad || '0') * parseFloat(p.valorUSD || '0')).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={[styles.row, { marginTop: 6, justifyContent: 'flex-end' }]}>
          <Text style={{ fontSize: 9, color: '#0061a6', fontWeight: 'bold' }}>FOB Total: USD {fob.toFixed(2)}</Text>
        </View>

        {/* Gastos */}
        <Text style={styles.sectionTitle}>Gastos de Importación</Text>
        <View style={styles.row}><Text style={styles.label}>Despacho:</Text><Text style={styles.value}>SIM {oc.gastosDespacho.sim} | Otros {oc.gastosDespacho.otros}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Despachante:</Text><Text style={styles.value}>Flete int&apos;l {oc.gastosDespachante.fleteInternacional} USD | Flete interno {oc.gastosDespachante.fleteInterno} | Terminal {oc.gastosDespachante.terminal}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Adicionales:</Text><Text style={styles.value}>Depósito {oc.gastosAdicionales.depositoFiscal} | Digital {oc.gastosAdicionales.digitalizacion} | Estancia {oc.gastosAdicionales.estanciaCamion}</Text></View>
        {oc.otrosGastos.length > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Otros gastos:</Text>
            <Text style={styles.value}>{oc.otrosGastos.map(g => `${g.descripcion} ${g.monto} ${g.divisa}`).join(' | ')}</Text>
          </View>
        )}

        {/* Value Cards */}
        <View style={styles.valueCardsRow}>
          <View style={styles.valueCard}>
            <Text style={styles.valueCardLabel}>FOB Total</Text>
            <Text style={styles.valueCardAmount}>USD {fob.toFixed(2)}</Text>
          </View>
          <View style={styles.valueCard}>
            <Text style={styles.valueCardLabel}>Total Gastos</Text>
            <Text style={styles.valueCardAmount}>USD {gastos.toFixed(2)}</Text>
          </View>
          <View style={styles.valueCard}>
            <Text style={styles.valueCardLabel}>Landed Cost</Text>
            <Text style={[styles.valueCardAmount, { color: '#62b446' }]}>USD {landed.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sistema integral COMEX — Desarrollado por Driva Dev (drivadev.com.ar)</Text>
        </View>
      </Page>
    </Document>
  )
}
