import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { AccountGate } from '@/components/AccountGate'
import { DbSync } from '@/components/DbSync'
import { BudgetListPage } from '@/pages/BudgetListPage'
import { BudgetFormPage } from '@/pages/BudgetFormPage'
import { BudgetDetailPage } from '@/pages/BudgetDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SharedBudgetPage } from '@/pages/SharedBudgetPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Vista pública del link compartido (fuera del layout del dueño) */}
        <Route path="ver/:id" element={<SharedBudgetPage />} />
        <Route
          element={
            <AccountGate>
              <DbSync>
                <AppLayout />
              </DbSync>
            </AccountGate>
          }
        >
          <Route index element={<BudgetListPage />} />
          <Route path="nuevo" element={<BudgetFormPage />} />
          <Route path="editar/:id" element={<BudgetFormPage />} />
          <Route path="presupuesto/:id" element={<BudgetDetailPage />} />
          <Route path="ajustes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
