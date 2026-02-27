import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KeysPage from './pages/KeysPage';
import RequestsPage from './pages/RequestsPage';

const NAV_ITEMS = [
  { to: '/', icon: '\u25C9', label: 'Dashboard', end: true },
  { to: '/keys', icon: '\u26BF', label: 'API Keys' },
  { to: '/requests', icon: '\u25CE', label: 'Requests' },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-[240px] min-h-screen flex-shrink-0 sticky top-0 h-screen flex flex-col border-r border-[rgba(255,255,255,0.07)]" style={{ background: 'rgba(255,255,255,0.02)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-5 border-b border-[rgba(255,255,255,0.07)] mb-5">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #F59E0B, #8B5CF6)' }}>
          P
        </div>
        <span className="font-bold text-[17px] tracking-tight">Prism</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all relative ${
                isActive
                  ? 'text-[#F5F5F7] border-l-2 border-[#F59E0B] -ml-[2px]'
                  : 'text-[rgba(255,255,255,0.55)] hover:text-[#F5F5F7]'
              }`}
              style={isActive ? { background: 'rgba(245,158,11,0.12)' } : undefined}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
              {isActive && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              )}
            </NavLink>
          );
        })}

        <div className="h-px bg-[rgba(255,255,255,0.07)] my-3 mx-2" />

        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-[rgba(255,255,255,0.55)] hover:text-[#F5F5F7] transition-all">
          <span className="text-base w-5 text-center">{'\u2197'}</span>
          Docs
        </a>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[rgba(255,255,255,0.07)] mt-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold truncate max-w-[140px]">{user?.company_name || user?.email}</div>
            <div className="text-[11px] font-medium tracking-wider uppercase text-[#F59E0B]">Free Trial</div>
          </div>
          <button
            onClick={logout}
            className="text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.7)] text-xs transition-colors"
            title="Logout"
          >
            {'\u2715'}
          </button>
        </div>
      </div>
    </aside>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen relative z-[1]">
      <Sidebar />
      <main className="flex-1 px-8 py-6 max-w-[1200px]">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen" style={{ background: '#0A0B0F' }} />;
  if (!token) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/keys" element={<ProtectedRoute><KeysPage /></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
