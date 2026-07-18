import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  WalletIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CalculatorIcon,
  CreditCardIcon,
  TagIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Ingresos', href: '/incomes', icon: ArrowTrendingUpIcon },
  { name: 'Egresos', href: '/expenses', icon: ArrowTrendingDownIcon },
  { name: 'Categorías', href: '/categories', icon: TagIcon },
  { name: 'Presupuestos', href: '/budgets', icon: ChartPieIcon },
  { name: 'Deudas', href: '/debts', icon: BanknotesIcon },
  { name: 'Ahorros', href: '/savings', icon: WalletIcon },
  { name: 'Calculadora', href: '/calculator', icon: CalculatorIcon },
  { name: 'Pago Deudas', href: '/debt-payoff', icon: CreditCardIcon },
  { name: 'Proyecciones', href: '/projections', icon: ChartBarIcon },
  { name: 'Reportes', href: '/reports', icon: DocumentChartBarIcon },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-gradient)' }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0" style={{ background: 'rgba(45, 52, 54, 0.6)' }} onClick={() => setSidebarOpen(false)} />
        <div
          className="fixed inset-y-0 left-0 flex flex-col w-72"
          style={{
            background: 'var(--clay-card)',
            boxShadow: 'var(--clay-shadow)',
            borderRight: '1px solid rgba(255, 255, 255, 0.6)',
          }}
        >
          <div className="flex items-center justify-between h-20 px-6" style={{ borderBottom: '2px solid #d4c4b4' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #d4a574, #c49464)', boxShadow: 'var(--clay-shadow-sm)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <span className="text-white font-bold text-lg">PF</span>
              </div>
              <span className="text-xl font-display font-bold" style={{ color: 'var(--clay-text)' }}>Portal Financiero</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl transition-all" style={{ color: 'var(--clay-text-muted)' }}>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4" style={{ borderTop: '2px solid #d4c4b4' }}>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#e8ddd0', boxShadow: 'var(--clay-shadow-sm)', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #d4a574, #c49464)', boxShadow: 'var(--clay-shadow-sm)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--clay-text)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--clay-text-muted)' }}>{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl transition-all"
                style={{ color: 'var(--clay-text-muted)' }}
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0">
        <div
          className="flex flex-col flex-grow"
          style={{
            background: 'var(--clay-card)',
            borderRight: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '4px 0 16px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center h-20 px-6" style={{ borderBottom: '2px solid #d4c4b4' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #d4a574, #c49464)', boxShadow: 'var(--clay-shadow-sm)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <span className="text-white font-bold text-lg">PF</span>
              </div>
              <span className="text-xl font-display font-bold" style={{ color: 'var(--clay-text)' }}>Portal Financiero</span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4" style={{ borderTop: '2px solid #d4c4b4' }}>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#e8ddd0', boxShadow: 'var(--clay-shadow-sm)', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #d4a574, #c49464)', boxShadow: 'var(--clay-shadow-sm)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--clay-text)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--clay-text-muted)' }}>{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl transition-all"
                style={{ color: 'var(--clay-text-muted)' }}
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div
          className="sticky top-0 z-40 flex items-center h-20 px-6 lg:hidden"
          style={{
            background: 'var(--clay-card)',
            borderBottom: '2px solid #d4c4b4',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl transition-all" style={{ color: 'var(--clay-text-muted)' }}>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #d4a574, #c49464)', boxShadow: 'var(--clay-shadow-sm)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <span className="text-white font-bold text-sm">PF</span>
            </div>
            <span className="text-lg font-display font-bold" style={{ color: 'var(--clay-text)' }}>Portal Financiero</span>
          </div>
        </div>
        <main className="p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
