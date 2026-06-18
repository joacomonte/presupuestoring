import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

// Sección plegable del formulario, con resumen breve cuando está colapsada (PRD §3).
export function Section({
  id,
  icon: Icon,
  title,
  summary,
  badge,
  open,
  onOpenChange,
  defaultOpen = true,
  plain = false,
  children,
}) {
  if (plain) {
    return (
      <div
        id={id}
        className="scroll-mt-20 overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <div className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
          {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <div className="font-medium leading-tight">{title}</div>
            {summary && (
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {summary}
              </div>
            )}
          </div>
          {badge}
        </div>
        <div className="border-t px-4 pb-5 pt-4">{children}</div>
      </div>
    )
  }

  return (
    <Collapsible
      id={id}
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
      className="scroll-mt-20 overflow-hidden rounded-xl border bg-card shadow-sm"
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3.5 text-left">
        {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" />}
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-tight">{title}</div>
          {summary && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {summary}
            </div>
          )}
        </div>
        {badge}
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-4 pb-5 pt-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
