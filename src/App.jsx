import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { BudgetListPage } from '@/pages/BudgetListPage'
import { BudgetFormPage } from '@/pages/BudgetFormPage'
import { BudgetDetailPage } from '@/pages/BudgetDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}

export default App
