import { useState } from 'react'
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
  warning: { icon: ExclamationTriangleIcon, color: '#C24E36', bg: 'var(--coral-tint)' },
  positive: { icon: CheckCircleIcon, color: '#3A6A34', bg: '#E8F4E5' },
  tip: { icon: LightBulbIcon, color: '#A5691A', bg: 'var(--amber-tint)' },
  info: { icon: InformationCircleIcon, color: '#14666B', bg: 'var(--water-tint)' },
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const WATER = '#1B8A8F'
const CORAL = '#E86A4E'
const INK_MUTED = '#6E8884'
const GRID = 'rgba(18, 51, 50, 0.06)'

export default function Dashboard() {
  const {
    loading,
    monthlyData,
    incomeSummary,
    expenseSummary,
    debtStatus,
    savingsSummary,
    categoriesData,
  } = useDashboardData()
  const { data: insightsData } = useInsights()
  const insights = insightsData?.insights || []

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

  const lineChartData = {
    labels: monthlyData?.data.map(d => getMonthName(d.month).substring(0, 3)) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyData?.data.map(d => d.income) || [],
        borderColor: WATER,
        backgroundColor: 'rgba(27, 138, 143, 0.10)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: WATER,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Egresos',
        data: monthlyData?.data.map(d => d.expenses) || [],
        borderColor: CORAL,
        backgroundColor: 'rgba(232, 106, 78, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: CORAL,
        pointBorderColor: '#FFFFFF',
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
        backgroundColor: '#123332',
        borderWidth: 0,
        titleColor: '#F6F3EC',
        bodyColor: '#C9D8D6',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => '  ' + formatCurrency(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: INK_MUTED,
          font: { family: '"Spline Sans Mono", monospace', size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID },
        ticks: {
          color: INK_MUTED,
          font: { family: '"Spline Sans Mono", monospace', size: 11 },
          callback: (value) => '$' + value.toLocaleString('es-CO'),
        },
      },
    },
  }

  const today = new Date()
  const monthLabel = `${getMonthName(today.getMonth() + 1)} ${today.getFullYear()}`

  /* Corrientes del mapa: top 5 categorías de gasto */
  const flowStreams = [...categoriesData]
    .filter((c) => c.category && Number(c.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 5)
    .map((c, i) => ({
      label: c.category,
      value: Number(c.total),
      color: flowPalette[(i + 1) % flowPalette.length],
    }))

  const stats = [
    {
      label: 'Ingresos del mes',
      value: formatCurrency(totalIncome),
      icon: ArrowTrendingUpIcon,
      tone: 'water',
    },
    {
      label: 'Egresos del mes',
      value: formatCurrency(totalExpenses),
      icon: ArrowTrendingDownIcon,
      tone: 'coral',
    },
    {
      label: 'Deudas activas',
      value: formatCurrency(debtStatus?.total_debt || 0),
      icon: BanknotesIcon,
      tone: 'amber',
    },
    {
      label: 'Total ahorros',
      value: formatCurrency(savingsSummary?.total_balance || 0),
      icon: WalletIcon,
      tone: 'ink',
    },
  ]

  const toneMap = {
    water: { color: WATER, bg: 'var(--water-tint)' },
    coral: { color: CORAL, bg: 'var(--coral-tint)' },
    amber: { color: '#C07D22', bg: 'var(--amber-tint)' },
    ink: { color: '#123332', bg: 'var(--mist-soft)' },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="eyebrow">Resumen · {monthLabel}</p>
          <h1 className="mt-2 text-4xl font-bold text-ink" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            El flujo de tu mes
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/incomes" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo ingreso
          </Link>
          <Link to="/expenses" className="btn-secondary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo egreso
          </Link>
        </div>
      </div>

      {/* Firma visual: el mapa de flujo */}
      <div className="card p-7 animate-slide-up shadow-flow-lg">
        <div className="flex items-start justify-between gap-6 flex-wrap mb-2">
          <div>
            <p className="eyebrow">Mapa de flujo</p>
            <h3 className="mt-1 text-xl font-bold text-ink" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
              A dónde se va tu plata
            </h3>
          </div>
          <div className="flex items-center gap-5 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-water inline-block" />
              Ingreso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-coral inline-block" />
              Gasto por categoría
            </span>
            <span className="fig">grosor = monto</span>
          </div>
        </div>
        <FlowMap income={totalIncome} streams={flowStreams} formatValue={formatCurrency} />
      </div>

      {/* Insights proactivos */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {insights.slice(0, 6).map((ins) => {
            const style = INSIGHT_STYLE[ins.type] || INSIGHT_STYLE.info
            const Icon = style.icon
            return (
              <div key={ins.id} className="card p-5 flex items-start gap-3 animate-slide-up" style={{ background: style.bg, borderColor: 'transparent' }}>
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: style.color }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: style.color }}>{ins.title}</p>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">{ins.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Hero: balance + tasa de ahorro */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-8 animate-slide-up" style={{ animationDelay: '60ms' }}>
          <p className="eyebrow">Balance neto del mes</p>
          <p
            className="fig mt-4 text-5xl xl:text-6xl font-semibold"
            style={{ color: balance >= 0 ? '#123332' : '#C24E36' }}
          >
            {formatCurrency(balance)}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: balance >= 0 ? '#3A6A34' : '#C24E36', fontFamily: '"Spline Sans Mono", monospace' }}>
            {balance >= 0 ? '▲ Positivo este mes' : '▼ Negativo este mes'}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-ink-muted">Ingresos</span>
              <span className="fig font-semibold text-success-600">+ {formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-ink-muted">Egresos</span>
              <span className="fig font-semibold text-danger-600">− {formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="card p-7 flex flex-col justify-center animate-slide-up" style={{ animationDelay: '120ms' }}>
          <p className="eyebrow">Tasa de ahorro</p>
          <p className="fig mt-3 text-5xl font-semibold text-water-dark">{savingsRate}%</p>
          <p className="mt-1 text-sm text-ink-muted">de tu ingreso se convierte en patrimonio</p>
          <div className="mt-6 w-full h-2.5 rounded-full bg-mist-soft border border-line overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%`, background: 'linear-gradient(90deg, #14666B, #22A0A6)' }}
            />
          </div>
          <div className="mt-6 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Ingresos</span>
              <span className="fig font-semibold text-ink">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Egresos</span>
              <span className="fig font-semibold text-ink">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-line">
              <span className="text-ink-muted">Balance neto</span>
              <span className={`fig font-bold ${balance >= 0 ? 'text-water-dark' : 'text-danger-600'}`}>{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={stat.label} className="card p-6 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border border-line"
                style={{ background: toneMap[stat.tone].bg }}
              >
                <stat.icon className="h-5 w-5" style={{ color: toneMap[stat.tone].color }} />
              </div>
              <span className="w-2 h-2 rounded-full" style={{ background: toneMap[stat.tone].color }} />
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted" style={{ fontFamily: '"Spline Sans Mono", monospace' }}>
              {stat.label}
            </p>
            <p className="fig mt-1 text-2xl font-semibold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-7 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="eyebrow">Evolución mensual</p>
              <h3 className="mt-1 text-xl font-bold text-ink" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Ingresos vs egresos</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: WATER }} />
                <span className="text-xs text-ink-muted" style={{ fontFamily: '"Spline Sans Mono", monospace' }}>INGRESOS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CORAL }} />
                <span className="text-xs text-ink-muted" style={{ fontFamily: '"Spline Sans Mono", monospace' }}>EGRESOS</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="card p-7 animate-slide-up">
          <p className="eyebrow">Liquidación del mes</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-mist-soft border border-line">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-water-tint">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-water-dark" />
                </div>
                <span className="text-sm text-ink-muted">Ingresos</span>
              </div>
              <span className="fig font-semibold text-water-dark">{formatCurrency(totalIncome)}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-mist-soft border border-line">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-coral-tint">
                  <ArrowTrendingDownIcon className="h-4 w-4 text-danger-600" />
                </div>
                <span className="text-sm text-ink-muted">Egresos</span>
              </div>
              <span className="fig font-semibold text-danger-600">{formatCurrency(totalExpenses)}</span>
            </div>

            <div className="p-5 rounded-xl" style={{ background: 'linear-gradient(160deg, #123332, #1B4744)', boxShadow: 'var(--shadow-md)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-paper/80">Balance neto</span>
                <span className={`fig text-2xl font-semibold ${balance >= 0 ? 'text-emerald-300' : 'text-coral-light'}`}
                  style={{ color: balance >= 0 ? '#9FD9B4' : '#F09A85' }}>
                  {formatCurrency(balance)}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-paper/60">Tasa de ahorro</span>
                  <span className="text-paper fig font-semibold">{savingsRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(246,243,236,0.15)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%`, background: 'linear-gradient(90deg, #5FB8BC, #9FD9B4)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-7 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="eyebrow">Pasivo</p>
              <h3 className="mt-1 text-xl font-bold text-ink" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Estado de deudas</h3>
            </div>
            <Link to="/debts" className="text-sm text-water-dark hover:text-water transition-colors" style={{ fontFamily: '"Spline Sans Mono", monospace' }}>
              ver todas →
            </Link>
          </div>
          {debtStatus?.debts?.length > 0 ? (
            <div className="divide-y divide-line">
              {debtStatus.debts.slice(0, 4).map((debt, index) => (
                <Link
                  key={debt.id}
                  to={`/debts/${debt.id}`}
                  className="flex items-center justify-between py-3.5 hover:bg-mist-soft transition-colors rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="fig text-xs text-ink-faint w-6">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-sm font-medium text-ink">{debt.name}</p>
                      <p className="text-xs text-ink-muted" style={{ fontFamily: '"Spline Sans Mono", monospace' }}>{debt.bank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="fig text-sm font-semibold text-ink">{formatCurrency(debt.balance)}</p>
                    <p className="text-xs text-ink-muted">{debt.remaining_months} meses</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <BanknotesIcon className="h-10 w-10 mx-auto text-ink-faint mb-3" />
              <p className="text-ink-muted">No hay deudas activas</p>
            </div>
          )}
        </div>

        <div className="card p-7 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="eyebrow">Activo</p>
              <h3 className="mt-1 text-xl font-bold text-ink" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Cuentas de ahorro</h3>
            </div>
            <Link to="/savings" className="text-sm text-water-dark hover:text-water transition-colors" style={{ fontFamily: '"Spline Sans Mono", monospace' }}>
              ver todas →
            </Link>
          </div>
          {savingsSummary?.accounts?.length > 0 ? (
            <div className="divide-y divide-line">
              {savingsSummary.accounts.slice(0, 4).map((account) => (
                <Link
                  key={account.id}
                  to={`/savings/${account.id}`}
                  className="flex items-center justify-between py-3.5 hover:bg-mist-soft transition-colors rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-line bg-amber-tint">
                      <WalletIcon className="h-4 w-4 text-warning-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{account.name}</p>
                      <p className="text-xs text-ink-muted" style={{ fontFamily: '"Spline Sans Mono", monospace' }}>{account.bank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="fig text-sm font-semibold text-ink">{formatCurrency(account.balance)}</p>
                    {account.progress !== null && (
                      <p className="text-xs text-ink-muted">{account.progress}% de meta</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <WalletIcon className="h-10 w-10 mx-auto text-ink-faint mb-3" />
              <p className="text-ink-muted">No hay cuentas de ahorro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
