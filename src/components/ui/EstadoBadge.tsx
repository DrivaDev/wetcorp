import type { EstadoOC } from '@/lib/mock-ocs'

const base = 'text-sm px-2 py-0.5 rounded-full'

const BADGE_MAP: Record<EstadoOC, string> = {
  borrador:    `${base} bg-fondo text-titulares border border-acento font-light`,
  en_proceso:  `${base} bg-acento/50 text-titulares font-light`,
  en_transito: `${base} bg-acento text-titulares font-normal`,
  en_aduana:   `${base} bg-principal/20 text-titulares font-normal`,
  entregada:   `${base} bg-principal/10 text-principal font-normal`,
  cancelada:   `${base} bg-texto/10 text-texto font-light line-through`,
}

const ESTADO_LABELS: Record<EstadoOC, string> = {
  borrador:    'Borrador',
  en_proceso:  'En proceso',
  en_transito: 'En tránsito',
  en_aduana:   'En aduana',
  entregada:   'Entregada',
  cancelada:   'Cancelada',
}

export function EstadoBadge({ estado }: { estado: EstadoOC }) {
  return <span className={BADGE_MAP[estado]}>{ESTADO_LABELS[estado]}</span>
}
