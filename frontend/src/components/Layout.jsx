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
      className={`${small ? 'w-9 h-9' : 'w-11 h-11'} rounded-full flex items-center justify-center flex-shrink-0 border border-water-tint`}
      style={{
        background: 'linear-gradient(140deg, #22A0A6, #14666B)',
        boxShadow: '0 6px 16px -8px rgba(27,138,143,0.5)',
      }}
    >
      <span
        className={`${small ? 'text-sm' : 'text-base'} text-white leading-none font-bold`}
        style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
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
      <div
        className="flex items-center h-20 px-6 gap-3 border-b border-line bg-white"
      >
        <BrandMark />
        <div className="leading-tight">
          <span className="block text-[17px] font-semibold text-ink" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            Portal Financiero
          </span>
          <span className="block text-[10px] tracking-[0.22em] uppercase text-water" style={{ fontFamily: '"Spline Sans Mono", monospace' }}>
            El mapa de tu dinero
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-dark-400" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
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

      <div className="p-3 border-t border-line bg-white">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-mist-soft border border-line">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border border-water-tint text-[15px] font-semibold bg-water-tint text-water-dark" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-ink">{user?.name}</p>
            <p className="text-[11px] truncate text-ink-muted" style={{ fontFamily: '"Spline Sans Mono", monospace' }}>{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-2 rounded-lg text-ink-muted hover:text-danger-500 hover:bg-coral-tint transition-all"
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
    <div className="min-h-screen" style={{ background: 'var(--bg-gradient)' }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0" style={{ background: 'rgba(14, 41, 40, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
        <div
          className="fixed inset-y-0 left-0 flex flex-col w-72 bg-white"
          style={{ borderRight: '1px solid var(--line)', boxShadow: '24px 0 60px -24px rgba(18,51,50,0.25)' }}
        >
          <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => setSidebarOpen(false)} />
          <button onClick={() => setSidebarOpen(false)} className="absolute top-6 right-3 p-2 rounded-lg text-ink-muted hover:text-ink">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white" style={{ borderRight: '1px solid var(--line)', boxShadow: '12px 0 40px -28px rgba(18,51,50,0.18)' }}>
        <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => {}} />
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <header
          className="sticky top-0 z-40 flex items-center h-20 px-6 lg:hidden bg-paper/90"
          style={{ backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-ink-muted hover:text-ink">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 ml-2">
            <BrandMark small />
            <span className="text-lg font-semibold text-ink" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Portal Financiero</span>
          </div>
        </header>
        <main className="p-6 lg:p-10 animate-fade-in max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
