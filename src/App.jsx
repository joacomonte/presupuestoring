import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { AccountGate } from '@/components/AccountGate'
import { DbSync } from '@/components/DbSync'
import { BudgetListPage } from '@/pages/BudgetListPage'
import { BudgetFormPage } from '@/pages/BudgetFormPage'
import { BudgetDetailPage } from '@/pages/BudgetDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SharedBudgetPage } from '@/pages/SharedBudgetPage'

// La cuenta activa es el primer segmento del path (ej. /blaster-detailing/...).
// Según ese segmento la app entra en uno de tres modos:
//  - 'ver'      → vista pública del link compartido (sin cuenta).
//  - sin cuenta → selector de cuentas (AccountGate).
//  - con cuenta → app montada con basename=/:cuenta; las rutas internas no cambian.
function App() {
  const segment = window.location.pathname.split('/')[1] || ''

  if (segment === 'ver') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="ver/:id" element={<SharedBudgetPage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  if (!segment) {
    return (
      <BrowserRouter>
        <AccountGate />
      </BrowserRouter>
    )
  }

  // Modo cuenta: basename=/:cuenta. Las navegaciones absolutas existentes ('/nuevo',
  // '/', etc.) quedan relativas a la cuenta sin tocar el resto del código.
  return (
    <BrowserRouter basename={`/${segment}`}>
      <DbSync>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<BudgetListPage />} />
            <Route path="nuevo" element={<BudgetFormPage />} />
            <Route path="editar/:id" element={<BudgetFormPage />} />
            <Route path="presupuesto/:id" element={<BudgetDetailPage />} />
            <Route path="ajustes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </DbSync>
    </BrowserRouter>
  )
}

export default App
