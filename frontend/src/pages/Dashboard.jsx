import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { formatCurrency, getMonthName } from '../utils/formatters'
import FlowMap from '../components/FlowMap'
import { flowPalette } from '../../../packages/design-tokens/index.js'
import { useDashboardData, useInsights } from '../hooks/useFinanceQueries'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  WalletIcon,
  PlusIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

const INSIGHT_STYLE = {
  warning: { icon: ExclamationTriangleIcon, color: '#F5B84B', bg: 'rgba(245,184,75,0.10)' },
  positive: { icon: CheckCircleIcon, color: '#37D399', bg: 'rgba(55,211,153,0.10)' },
  tip: { icon: LightBulbIcon, color: '#8FA8FF', bg: 'rgba(108,140,255,0.10)' },
  info: { icon: InformationCircleIcon, color: '#8794A8', bg: 'rgba(255,255,255,0.03)' },
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler)

const WATER = '#6C8CFF'
const CORAL = '#FF6B6B'
const INK_MUTED = '#8794A8'
const GRID = 'rgba(255,255,255,0.06)'

export default function Dashboard() {
  const { loading, monthlyData, incomeSummary, expenseSummary, debtStatus, savingsSummary, categoriesData } = useDashboardData()
  const { data: insightsData } = useInsights()
  const insights = (insightsData?.insights || []).slice(0, 4)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="w-16 h-16 border border-mist rounded-full"></div>
          <div className="w-16 h-16 border-2 border-water rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  const totalIncome = Number(incomeSummary?.total) || 0
  const totalExpenses = Number(expenseSummary?.total) || 0
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0
  const positive = balance >= 0

  const debts = debtStatus?.debts || []
  const accounts = savingsSummary?.accounts || []
  const maxDebt = Math.max(1, ...debts.map((d) => Number(d.balance) || 0))

  const lineChartData = {
    labels: monthlyData?.data.map((d) => getMonthName(d.month).substring(0, 3)) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyData?.data.map((d) => d.income) || [],
        borderColor: WATER,
        backgroundColor: 'rgba(108,140,255,0.14)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: WATER,
        pointBorderColor: '#10151F',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Egresos',
        data: monthlyData?.data.map((d) => d.expenses) || [],
        borderColor: CORAL,
        backgroundColor: 'rgba(255,107,107,0.10)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: CORAL,
        pointBorderColor: '#10151F',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161D2A',
        borderColor: '#2A3648',
        borderWidth: 1,
        titleColor: '#E8EEF7',
        bodyColor: '#C2CCDA',
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: (ctx) => '  ' + formatCurrency(ctx.parsed.y) },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: INK_MUTED, font: { family: '"JetBrains Mono", monospace', size: 11 } } },
      y: {
        beginAtZero: true,
        grid: { color: GRID },
        ticks: { color: INK_MUTED, font: { family: '"JetBrains Mono", monospace', size: 11 }, callback: (v) => '$' + v.toLocaleString('es-CO') },
      },
    },
  }

  const today = new Date()
  const monthLabel = `${getMonthName(today.getMonth() + 1)} ${today.getFullYear()}`

  const flowStreams = [...categoriesData]
    .filter((c) => c.category && Number(c.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 5)
    .map((c, i) => ({ label: c.category, value: Number(c.total), color: flowPalette[(i + 1) % flowPalette.length] }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="eyebrow">Resumen · {monthLabel}</p>
          <h1 className="mt-2 text-3xl font-bold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>
            El flujo de tu mes
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/incomes" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Ingreso
          </Link>
          <Link to="/expenses" className="btn-secondary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Egreso
          </Link>
        </div>
      </div>

      {/* Cockpit: balance + entradas/salidas + tasa (una sola banda) */}
      <div className="card overflow-hidden animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr_1fr] lg:divide-x divide-y lg:divide-y-0 divide-line">
          <div className="p-6 lg:p-7">
            <p className="eyebrow">Balance neto del mes</p>
            <p className="fig mt-3 text-4xl xl:text-5xl font-semibold leading-none" style={{ color: positive ? 'var(--ink)' : 'var(--loss)' }}>
              {formatCurrency(balance)}
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: positive ? 'var(--gain)' : 'var(--loss)', fontFamily: '"JetBrains Mono", monospace' }}>
              {positive ? '▲ Positivo este mes' : '▼ Negativo este mes'}
            </p>
          </div>

          <div className="p-6 lg:p-7 grid grid-rows-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-ink-muted">
                <ArrowTrendingUpIcon className="h-4 w-4 text-water" /> Ingresos
              </span>
              <span className="fig font-semibold text-ink">+ {formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="flex items-center gap-2 text-sm text-ink-muted">
                <ArrowTrendingDownIcon className="h-4 w-4 text-loss" /> Egresos
              </span>
              <span className="fig font-semibold text-ink">− {formatCurrency(totalExpenses)}</span>
            </div>
          </div>

          <div className="p-6 lg:p-7">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Tasa de ahorro</p>
              <span className="fig text-3xl font-semibold text-water">{savingsRate}%</span>
            </div>
            <div className="mt-4 w-full h-2 rounded-full bg-mist-soft border border-line overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%`, background: 'var(--accent-grad)' }}
              />
            </div>
            <p className="mt-4 text-xs text-ink-muted">de tu ingreso se convierte en patrimonio</p>
          </div>
        </div>
      </div>

      {/* Firma + insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-6 lg:p-7 animate-slide-up">
          <div className="flex items-start justify-between gap-6 flex-wrap mb-2">
            <div>
              <p className="eyebrow">Mapa de flujo</p>
              <h3 className="mt-1 text-lg font-bold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>A dónde se va tu plata</h3>
            </div>
            <div className="flex items-center gap-5 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-water inline-block" /> Ingreso</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-coral inline-block" /> Categoría</span>
              <span className="fig hidden sm:inline">grosor = monto</span>
            </div>
          </div>
          <FlowMap income={totalIncome} streams={flowStreams} formatValue={formatCurrency} />
        </div>

        <div className="card p-5 animate-slide-up">
          <p className="eyebrow mb-4">Observaciones</p>
          {insights.length === 0 ? (
            <p className="text-sm text-ink-muted py-6">Sin observaciones por ahora.</p>
          ) : (
            <div className="space-y-2">
              {insights.map((ins) => {
                const style = INSIGHT_STYLE[ins.type] || INSIGHT_STYLE.info
                const Icon = style.icon
                return (
                  <div key={ins.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: style.bg }}>
                    <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: style.color }} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: style.color }}>{ins.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{ins.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Evolución + posición */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-6 lg:p-7 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="eyebrow">Evolución mensual</p>
              <h3 className="mt-1 text-lg font-bold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>Ingresos vs egresos</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-xs text-ink-muted" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: WATER }} /> INGRESOS
              </span>
              <span className="flex items-center gap-2 text-xs text-ink-muted" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CORAL }} /> EGRESOS
              </span>
            </div>
          </div>
          <div className="h-72">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <p className="eyebrow">Posición</p>
            <span className="fig text-xs text-ink-muted">activo − pasivo</span>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink"><BanknotesIcon className="h-4 w-4 text-loss" /> Deudas</span>
            <span className="fig text-sm font-semibold text-ink">{formatCurrency(debtStatus?.total_debt || 0)}</span>
          </div>
          {debts.length === 0 ? (
            <p className="text-xs text-ink-muted pb-2">Sin deudas activas.</p>
          ) : (
            <div className="space-y-2.5">
              {debts.slice(0, 3).map((debt) => (
                <Link key={debt.id} to={`/debts/${debt.id}`} className="block group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted truncate group-hover:text-ink">{debt.name}</span>
                    <span className="fig text-ink">{formatCurrency(debt.balance)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-mist-soft overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((Number(debt.balance) / maxDebt) * 100)}%`, background: 'var(--loss)' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="my-5 border-t border-line" />

          <div className="flex items-baseline justify-between mb-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink"><WalletIcon className="h-4 w-4 text-gain" /> Ahorros</span>
            <span className="fig text-sm font-semibold text-ink">{formatCurrency(savingsSummary?.total_balance || 0)}</span>
          </div>
          {accounts.length === 0 ? (
            <p className="text-xs text-ink-muted">Sin cuentas de ahorro.</p>
          ) : (
            <div className="space-y-2.5">
              {accounts.slice(0, 3).map((account) => (
                <Link key={account.id} to={`/savings/${account.id}`} className="block group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted truncate group-hover:text-ink">{account.name}</span>
                    <span className="fig text-ink">{formatCurrency(account.balance)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-mist-soft overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, account.progress || 0))}%`, background: 'var(--gain)' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-5">
            <Link to="/debts" className="btn-secondary flex-1 text-xs py-2">Deudas</Link>
            <Link to="/savings" className="btn-secondary flex-1 text-xs py-2">Ahorros</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
