import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AcolhidosPage } from './pages/AcolhidosPage'
import { CadastrosPage } from './pages/CadastrosPage'
import { DashboardPage } from './pages/DashboardPage'
import { ManagementPage } from './pages/ManagementPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/acolhidos" element={<AcolhidosPage />} />
        <Route path="/gestao" element={<ManagementPage />} />
        <Route path="/cadastros" element={<CadastrosPage />} />
      </Route>

      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
