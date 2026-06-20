import { Component } from 'react'
import { RotateCcw, Wand2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STORAGE_KEY } from '@/data/seed'

// Atrapa errores de render para que un crash no deje la pantalla en blanco.
// Muestra una pantalla de recuperación con "Reintentar" y "Reiniciar datos"
// (este último limpia el localStorage por el usuario, sin instrucciones manuales).
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  // "Arreglo rápido": limpia solo la caché local (no la cuenta ni la DB) y
  // recarga. Los datos se vuelven a bajar de la DB, así que no se pierde nada.
  handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="size-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Algo salió mal</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Tuvimos un problemita al mostrar esta pantalla. Probá de nuevo; si
            sigue, tocá el arreglo rápido (no se pierde nada, tus datos están
            guardados).
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button id="error-reintentar" size="lg" onClick={this.handleRetry}>
            <RotateCcw className="size-5" />
            Probar de nuevo
          </Button>
          <Button
            id="error-reiniciar"
            size="lg"
            variant="outline"
            onClick={this.handleReset}
          >
            <Wand2 className="size-5" />
            Arreglo rápido
          </Button>
        </div>
      </div>
    )
  }
}
