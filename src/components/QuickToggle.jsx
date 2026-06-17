import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

// Segmented control / chips. Selección de 1 valor con un clic (PRD §2.2).
// options: [{ value, label, hint? }]
// allowAdd + onAddOption(name) => value: alta inline de opciones simples (PRD §2.2).
export function QuickToggle({
  options,
  value,
  onChange,
  allowAdd = false,
  onAddOption,
  addPlaceholder = 'Nueva opción',
  size = 'default',
  className,
  id,
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = () => {
    const name = draft.trim()
    if (name && onAddOption) {
      const v = onAddOption(name)
      if (v != null) onChange(v)
    }
    setDraft('')
    setAdding(false)
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            id={id ? `${id}-${opt.value}` : undefined}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border font-medium transition select-none',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background hover:bg-accent active:bg-accent'
            )}
          >
            {active && <Check className="size-3.5 shrink-0" />}
            <span>{opt.label}</span>
            {opt.hint != null && (
              <span
                className={cn(
                  'text-xs',
                  active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}
              >
                {opt.hint}
              </span>
            )}
          </button>
        )
      })}

      {allowAdd &&
        (adding ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
              if (e.key === 'Escape') {
                setAdding(false)
                setDraft('')
              }
            }}
            onBlur={commit}
            placeholder={addPlaceholder}
            className="h-9 w-40"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <Plus className="size-3.5" /> Agregar
          </button>
        ))}
    </div>
  )
}
