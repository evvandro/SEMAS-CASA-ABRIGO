import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { GuestRoute } from './routes/GuestRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';

// Páginas pesadas em chunks próprios: saem do bundle inicial e carregam sob
// demanda (o Suspense fica em volta do Outlet no AppLayout).
const AcolhidosPage = lazy(() =>
  import('./pages/AcolhidosPage').then((m) => ({ default: m.AcolhidosPage })),
);
const ManagementPage = lazy(() =>
  import('./pages/ManagementPage').then((m) => ({ default: m.ManagementPage })),
);
const CadastrosPage = lazy(() =>
  import('./pages/CadastrosPage').then((m) => ({ default: m.CadastrosPage })),
);
const SetoresPage = lazy(() =>
  import('./pages/SetoresPage').then((m) => ({ default: m.SetoresPage })),
);
const EstoquePage = lazy(() =>
  import('./pages/EstoquePage').then((m) => ({ default: m.EstoquePage })),
);
const SaidasPage = lazy(() =>
  import('./pages/SaidasPage').then((m) => ({ default: m.SaidasPage })),
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const RelatoriosPage = lazy(() =>
  import('./modules/relatorios').then((m) => ({ default: m.RelatoriosPage })),
);

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
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route
            path="/gestao"
            element={<Navigate to="/acolhidos/gestao" replace />}
          />
          <Route
            path="/cadastros"
            element={<Navigate to="/acolhidos/cadastros" replace />}
          />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
