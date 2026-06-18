import { useState } from 'react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Gate de acceso simple. NO es seguridad real (la palabra está en el bundle y
// cualquiera puede setear el localStorage), solo evita que entren de casualidad.
const SECRET = 'blaster!'
const KEY = 'pr-auth'

export function AuthGate({ children }) {
  const [authed, setAuthed] = useState(() => localStorage.getItem(KEY) === SECRET)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  if (authed) return children

  const submit = (e) => {
    e.preventDefault()
    if (value === SECRET) {
      localStorage.setItem(KEY, SECRET)
      setAuthed(true)
    } else {
      setError(true)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-background p-6 shadow-sm"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo className="size-20" />
          <h1 className="text-lg font-semibold">Blaster Detailing</h1>
        </div>
        <p className="text-center text-sm text-muted-foreground">Ingresá la palabra de acceso para continuar.</p>
        <div className="space-y-1.5">
          <Label htmlFor="secret">Palabra de acceso</Label>
          <Input
            id="secret"
            type="password"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(false)
            }}
            aria-invalid={error}
          />
          {error && <p className="text-xs text-destructive">Palabra incorrecta.</p>}
        </div>
        <Button type="submit" className="w-full" id="btn-acceder">
          Entrar
        </Button>
      </form>
    </div>
  )
}
