import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AcolhidosPage } from './pages/AcolhidosPage'
import { CadastrosPage } from './pages/CadastrosPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ManagementPage } from './pages/ManagementPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SetoresPage } from './pages/SetoresPage'
import { EstoquePage } from './pages/EstoquePage'
import { SaidasPage } from './pages/SaidasPage'
import { GuestRoute } from './routes/GuestRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/acolhidos" element={<AcolhidosPage />} />
          <Route path="/acolhidos/gestao" element={<ManagementPage />} />
          <Route path="/acolhidos/cadastros" element={<CadastrosPage />} />
          <Route path="/setores" element={<SetoresPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/saidas" element={<SaidasPage />} />
          <Route path="/gestao" element={<Navigate to="/acolhidos/gestao" replace />} />
          <Route path="/cadastros" element={<Navigate to="/acolhidos/cadastros" replace />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
