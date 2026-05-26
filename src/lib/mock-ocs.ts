export type EstadoOC =
  | 'borrador'
  | 'en_proceso'
  | 'en_transito'
  | 'en_aduana'
  | 'entregada'
  | 'cancelada'

export interface OC {
  id: string
  numeroOC: string
  proveedor: string
  emailProveedor: string
  despachante: string
  emailDespachante: string
  estado: EstadoOC
  fecha: string
}

export const MOCK_OCS: OC[] = [
  {
    id: '1',
    numeroOC: 'OC-001',
    proveedor: 'Importadora del Sur',
    emailProveedor: 'proveedor@empresa.com',
    despachante: 'Logística Rápida SA',
    emailDespachante: 'despachante@logistica.com',
    estado: 'borrador',
    fecha: '2025-01-15',
  },
  {
    id: '2',
    numeroOC: 'OC-002',
    proveedor: 'Tech Supplies SA',
    emailProveedor: 'proveedor@empresa.com',
    despachante: 'Logística Rápida SA',
    emailDespachante: 'despachante@logistica.com',
    estado: 'en_proceso',
    fecha: '2025-02-03',
  },
  {
    id: '3',
    numeroOC: 'OC-003',
    proveedor: 'Comercial Andina SRL',
    emailProveedor: 'proveedor@empresa.com',
    despachante: 'Logística Rápida SA',
    emailDespachante: 'despachante@logistica.com',
    estado: 'en_transito',
    fecha: '2025-03-20',
  },
  {
    id: '4',
    numeroOC: 'OC-004',
    proveedor: 'Distribuidora Norte',
    emailProveedor: 'proveedor@empresa.com',
    despachante: 'Logística Rápida SA',
    emailDespachante: 'despachante@logistica.com',
    estado: 'en_aduana',
    fecha: '2025-04-10',
  },
  {
    id: '5',
    numeroOC: 'OC-005',
    proveedor: 'Global Import Ltda',
    emailProveedor: 'proveedor@empresa.com',
    despachante: 'Logística Rápida SA',
    emailDespachante: 'despachante@logistica.com',
    estado: 'entregada',
    fecha: '2025-05-05',
  },
  {
    id: '6',
    numeroOC: 'OC-006',
    proveedor: 'Mercantil del Plata',
    emailProveedor: 'otro@proveedor.com',
    despachante: 'Logística Rápida SA',
    emailDespachante: 'despachante@logistica.com',
    estado: 'cancelada',
    fecha: '2025-06-18',
  },
  {
    id: '7',
    numeroOC: 'OC-007',
    proveedor: 'Exportaciones Cuyanas',
    emailProveedor: 'otro@proveedor.com',
    despachante: 'Logística Rápida SA',
    emailDespachante: 'despachante@logistica.com',
    estado: 'borrador',
    fecha: '2025-07-22',
  },
  {
    id: '8',
    numeroOC: 'OC-008',
    proveedor: 'Pacific Trade Co',
    emailProveedor: 'otro@proveedor.com',
    despachante: 'Despachos del Sur SRL',
    emailDespachante: 'otro@despacho.com',
    estado: 'en_proceso',
    fecha: '2025-08-14',
  },
  {
    id: '9',
    numeroOC: 'OC-009',
    proveedor: 'Inversiones del Litoral',
    emailProveedor: 'otro@proveedor.com',
    despachante: 'Despachos del Sur SRL',
    emailDespachante: 'otro@despacho.com',
    estado: 'en_transito',
    fecha: '2025-09-30',
  },
  {
    id: '10',
    numeroOC: 'OC-010',
    proveedor: 'Sudamérica Cargo SA',
    emailProveedor: 'otro@proveedor.com',
    despachante: 'Despachos del Sur SRL',
    emailDespachante: 'otro@despacho.com',
    estado: 'entregada',
    fecha: '2025-12-01',
  },
]
