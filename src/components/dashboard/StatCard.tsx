import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  value: number
  label: string
}

export function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="bg-white border border-acento rounded-xl p-6 flex flex-col gap-3">
      <Icon size={24} className="text-principal" />
      <p className="text-4xl font-bold text-texto">{value}</p>
      <p className="text-sm font-light text-titulares">{label}</p>
    </div>
  )
}
