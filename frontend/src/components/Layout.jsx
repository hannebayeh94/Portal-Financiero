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
  BeakerIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'

const navGroups = [
  {
    label: 'Vista general',
    items: [{ name: 'Dashboard', href: '/', icon: HomeIcon }],
  },
  {
    label: 'Gestión',
    items: [
      { name: 'Ingresos', href: '/incomes', icon: ArrowTrendingUpIcon },
      { name: 'Egresos', href: '/expenses', icon: ArrowTrendingDownIcon },
      { name: 'Categorías', href: '/categories', icon: TagIcon },
      { name: 'Presupuestos', href: '/budgets', icon: ChartPieIcon },
      { name: 'Deudas', href: '/debts', icon: BanknotesIcon },
      { name: 'Ahorros', href: '/savings', icon: WalletIcon },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { name: 'Calculadora', href: '/calculator', icon: CalculatorIcon },
      { name: 'Tarjeta', href: '/credit-card', icon: CreditCardIcon },
      { name: 'Pago Deudas', href: '/debt-payoff', icon: CreditCardIcon },
      { name: 'Proyecciones', href: '/projections', icon: ChartBarIcon },
      { name: 'Simulador', href: '/simulator', icon: BeakerIcon },
      { name: 'Reportes', href: '/reports', icon: DocumentChartBarIcon },
    ],
  },
]

function BrandMark({ small = false }) {
  return (
    <div
      className={`${small ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{ background: 'var(--accent-grad)', boxShadow: '0 10px 24px -12px rgba(108,140,255,0.9)' }}
    >
      <span
        className={`${small ? 'text-sm' : 'text-base'} text-[#08101C] leading-none font-extrabold`}
        style={{ fontFamily: '"Sora", sans-serif' }}
      >
        PF
      </span>
    </div>
  )
}

function SidebarContent({ user, onLogout, onNavigate }) {
  const location = useLocation()
  return (
    <>
      <div className="flex items-center h-20 px-5 gap-3 border-b border-line">
        <BrandMark />
        <div className="leading-tight">
          <span className="block text-[16px] font-semibold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>
            Portal Financiero
          </span>
          <span className="block text-[10px] tracking-[0.2em] uppercase text-water" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            El mapa de tu dinero
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onNavigate}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-line">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-100 border border-line">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-[15px] font-bold text-[#08101C]"
            style={{ background: 'var(--accent-grad)', fontFamily: '"Sora", sans-serif' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-ink">{user?.name}</p>
            <p className="text-[11px] truncate text-ink-muted" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{user?.email}</p>
          </div>
          <Link
            to="/change-password"
            onClick={onNavigate}
            title="Cambiar contraseña"
            className="p-2 rounded-lg text-ink-muted hover:text-water hover:bg-dark-200 transition-all"
          >
            <KeyIcon className="h-5 w-5" />
          </Link>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-2 rounded-lg text-ink-muted hover:text-danger-500 hover:bg-dark-200 transition-all"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0" style={{ background: 'rgba(3,6,11,0.7)', backdropFilter: 'blur(6px)' }} onClick={() => setSidebarOpen(false)} />
        <div
          className="fixed inset-y-0 left-0 flex flex-col w-72 bg-card"
          style={{ borderRight: '1px solid var(--line)', boxShadow: '32px 0 80px -40px rgba(0,0,0,0.9)' }}
        >
          <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => setSidebarOpen(false)} />
          <button onClick={() => setSidebarOpen(false)} className="absolute top-6 right-3 p-2 rounded-lg text-ink-muted hover:text-ink">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-card" style={{ borderRight: '1px solid var(--line)' }}>
        <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => {}} />
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <header
          className="sticky top-0 z-40 flex items-center h-20 px-6 lg:hidden bg-paper/80"
          style={{ backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--line)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-ink-muted hover:text-ink">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 ml-2">
            <BrandMark small />
            <span className="text-lg font-semibold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>Portal Financiero</span>
          </div>
        </header>
        <main className="p-6 lg:p-10 animate-fade-in max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
