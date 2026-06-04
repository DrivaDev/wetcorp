'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { PAISES } from '@/lib/paises'
import { cn } from '@/lib/utils'

interface PaisComboboxProps {
  value: string
  onChange: (value: string) => void
  hasError?: boolean
}

export function PaisCombobox({ value, onChange, hasError }: PaisComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = query.trim()
    ? PAISES.filter((p) => p.toLowerCase().includes(query.toLowerCase()))
    : PAISES

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const handleSelect = (pais: string) => {
    onChange(pais)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg border bg-white text-base transition-colors duration-150 text-left',
          hasError
            ? 'border-red-500 focus:ring-2 focus:ring-red-500'
            : open
            ? 'border-principal ring-2 ring-principal/30'
            : 'border-acento hover:border-principal/50',
          value ? 'text-texto' : 'text-texto/50'
        )}
      >
        <span className="truncate">{value || 'Seleccioná un país...'}</span>
        <span className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="p-0.5 rounded hover:bg-acento/50 text-texto/40 hover:text-texto transition-colors"
              aria-label="Limpiar"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={cn('text-texto/50 transition-transform duration-150', open && 'rotate-180')}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-acento bg-white shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-acento/60">
            <Search size={14} className="text-texto/40 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar país..."
              className="flex-1 text-sm text-texto placeholder:text-texto/40 bg-transparent outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-texto/40 hover:text-texto">
                <X size={13} />
              </button>
            )}
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-texto/40">Sin resultados</li>
            ) : (
              filtered.map((pais) => (
                <li key={pais}>
                  <button
                    type="button"
                    onClick={() => handleSelect(pais)}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm transition-colors duration-100',
                      pais === value
                        ? 'bg-principal/10 text-principal font-medium'
                        : 'text-texto hover:bg-acento/30'
                    )}
                  >
                    {pais}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
