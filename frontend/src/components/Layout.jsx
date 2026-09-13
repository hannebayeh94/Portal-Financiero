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

// Un solo origen de verdad para navegación: secciones → items.
const sections = [
  {
    id: 'general',
    label: 'General',
    items: [{ name: 'Dashboard', href: '/', icon: HomeIcon }],
  },
  {
    id: 'gestion',
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
    id: 'analisis',
    label: 'Análisis',
    items: [
      { name: 'Calculadora', href: '/calculator', icon: CalculatorIcon },
      { name: 'Tarjeta', href: '/credit-card', icon: CreditCardIcon },
      { name: 'Pago de deudas', href: '/debt-payoff', icon: CreditCardIcon },
      { name: 'Proyecciones', href: '/projections', icon: ChartBarIcon },
      { name: 'Simulador', href: '/simulator', icon: BeakerIcon },
      { name: 'Reportes', href: '/reports', icon: DocumentChartBarIcon },
    ],
  },
]

function findCurrent(pathname) {
  for (const s of sections) {
    const item = s.items.find((i) => i.href === pathname)
    if (item) return { section: s.label, item }
  }
  return { section: 'General', item: { name: 'Portal', href: pathname } }
}

function BrandMark({ small = false }) {
  return (
    <div
      className={`${small ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{ background: 'var(--accent-grad)', boxShadow: '0 10px 24px -12px rgba(108,140,255,0.9)' }}
    >
      <span className={`${small ? 'text-sm' : 'text-base'} text-[#08101C] leading-none font-extrabold`} style={{ fontFamily: '"Sora", sans-serif' }}>
        PF
      </span>
    </div>
  )
}

// Rail de iconos (desktop): poco ancho, mucho contenido.
function Rail({ pathname, user, onLogout }) {
  return (
    <div className="flex flex-col items-center h-full py-4">
      <Link to="/" title="Portal Financiero" className="mb-5">
        <BrandMark />
      </Link>

      <nav className="flex-1 w-full flex flex-col items-center gap-1 overflow-y-auto px-2">
        {sections.map((s, si) => (
          <div key={s.id} className="w-full flex flex-col items-center">
            {si > 0 && <span className="w-8 h-px bg-line my-2" />}
            {s.items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={item.name}
                  className={`group relative flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-colors ${isActive ? 'text-water' : 'text-ink-muted hover:text-ink hover:bg-dark-100'}`}
                >
                  <item.icon className="h-[21px] w-[21px]" />
                  {isActive && <span className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-5 rounded-full" style={{ background: 'var(--accent-grad)' }} />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-2 pt-3 mt-2 border-t border-line w-full">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold text-[#08101C]" style={{ background: 'var(--accent-grad)', fontFamily: '"Sora", sans-serif' }} title={user?.name}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <Link to="/change-password" title="Cambiar contraseña" className="p-2 rounded-lg text-ink-muted hover:text-water hover:bg-dark-100 transition-colors">
          <KeyIcon className="h-5 w-5" />
        </Link>
        <button onClick={onLogout} title="Cerrar sesión" className="p-2 rounded-lg text-ink-muted hover:text-danger-500 hover:bg-dark-100 transition-colors">
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Drawer (mobile): mismas secciones con etiquetas.
function Drawer({ pathname, user, onLogout, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-20 px-5 gap-3 border-b border-line">
        <BrandMark small />
        <div className="leading-tight">
          <span className="block text-[16px] font-semibold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>Portal Financiero</span>
          <span className="block text-[10px] tracking-[0.2em] uppercase text-water" style={{ fontFamily: '"JetBrains Mono", monospace' }}>El mapa de tu dinero</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-6">
        {sections.map((s) => (
          <div key={s.id}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{s.label}</p>
            <div className="space-y-0.5">
              {s.items.map((item) => (
                <Link key={item.name} to={item.href} onClick={onNavigate} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-line">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-100 border border-line">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[15px] font-bold text-[#08101C]" style={{ background: 'var(--accent-grad)', fontFamily: '"Sora", sans-serif' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-ink">{user?.name}</p>
            <p className="text-[11px] truncate text-ink-muted" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{user?.email}</p>
          </div>
          <Link to="/change-password" onClick={onNavigate} className="p-2 rounded-lg text-ink-muted hover:text-water hover:bg-dark-200 transition-colors">
            <KeyIcon className="h-5 w-5" />
          </Link>
          <button onClick={onLogout} className="p-2 rounded-lg text-ink-muted hover:text-danger-500 hover:bg-dark-200 transition-colors">
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { section, item } = findCurrent(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const todayLabel = new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="min-h-screen">
      {/* Drawer móvil */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0" style={{ background: 'rgba(3,6,11,0.72)', backdropFilter: 'blur(6px)' }} onClick={() => setDrawerOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-card flex flex-col" style={{ borderRight: '1px solid var(--line)', boxShadow: '32px 0 80px -40px rgba(0,0,0,0.9)' }}>
          <Drawer pathname={location.pathname} user={user} onLogout={handleLogout} onNavigate={() => setDrawerOpen(false)} />
          <button onClick={() => setDrawerOpen(false)} className="absolute top-6 right-3 p-2 rounded-lg text-ink-muted hover:text-ink">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Rail desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-[76px] lg:flex bg-card z-40" style={{ borderRight: '1px solid var(--line)' }}>
        <Rail pathname={location.pathname} user={user} onLogout={handleLogout} />
      </div>

      <div className="lg:pl-[76px]">
        {/* Barra superior: contexto + acciones globales */}
        <header
          className="sticky top-0 z-30 flex items-center gap-4 h-16 px-4 lg:px-8 bg-paper/85"
          style={{ backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--line)' }}
        >
          <button onClick={() => setDrawerOpen(true)} className="lg:hidden p-2 rounded-lg text-ink-muted hover:text-ink">
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {section}
            </span>
            <span className="text-ink-faint">/</span>
            <span className="text-sm font-semibold text-ink truncate" style={{ fontFamily: '"Sora", sans-serif' }}>{item.name}</span>
          </div>

          <div className="flex-1" />

          <span className="hidden sm:block text-[11px] uppercase tracking-[0.16em] text-ink-muted" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {todayLabel}
          </span>
          <div className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold text-[#08101C]" style={{ background: 'var(--accent-grad)', fontFamily: '"Sora", sans-serif' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1500px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
