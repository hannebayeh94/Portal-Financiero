import { useState, useEffect } from 'react'
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
import api from '../services/api'
import { formatCurrency, getMonthName } from '../utils/formatters'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  WalletIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

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

const GOLD = '#e2b153'
const GOLD_SOFT = 'rgba(226, 177, 83, 0.12)'
const RED = '#e4635c'
const RED_SOFT = 'rgba(228, 99, 92, 0.12)'
const MUTED = '#7c8698'
const GRID = 'rgba(255, 255, 255, 0.05)'

export default function Dashboard() {
  const [monthlyData, setMonthlyData] = useState(null)
  const [incomeSummary, setIncomeSummary] = useState(null)
  const [expenseSummary, setExpenseSummary] = useState(null)
  const [debtStatus, setDebtStatus] = useState(null)
  const [savingsSummary, setSavingsSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [monthly, income, expense, debts, savings] = await Promise.all([
        api.get('/reports/monthly-evolution'),
        api.get('/incomes/summary'),
        api.get('/expenses/summary'),
        api.get('/reports/debt-status'),
        api.get('/savings/summary'),
      ])
      setMonthlyData(monthly.data)
      setIncomeSummary(income.data)
      setExpenseSummary(expense.data)
      setDebtStatus(debts.data)
      setSavingsSummary(savings.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="w-16 h-16 border border-dark-300 rounded-full"></div>
          <div className="w-16 h-16 border-2 border-primary-500 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  const totalIncome = incomeSummary?.total || 0
  const totalExpenses = expenseSummary?.total || 0
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0

  const lineChartData = {
    labels: monthlyData?.data.map(d => getMonthName(d.month).substring(0, 3)) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyData?.data.map(d => d.income) || [],
        borderColor: GOLD,
        backgroundColor: GOLD_SOFT,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: GOLD,
        pointBorderColor: '#11151e',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Egresos',
        data: monthlyData?.data.map(d => d.expenses) || [],
        borderColor: RED,
        backgroundColor: RED_SOFT,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: RED,
        pointBorderColor: '#11151e',
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
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1b2130',
        borderColor: '#2c3650',
        borderWidth: 1,
        titleColor: '#eceee6',
        bodyColor: '#a6b0c2',
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
          color: MUTED,
          font: { family: '"IBM Plex Mono", monospace', size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID },
        ticks: {
          color: MUTED,
          font: { family: '"IBM Plex Mono", monospace', size: 11 },
          callback: (value) => '$' + value.toLocaleString('es-CO'),
        },
      },
    },
  }

  const today = new Date()
  const monthLabel = `${getMonthName(today.getMonth() + 1)} ${today.getFullYear()}`

  const stats = [
    {
      label: 'Ingresos del mes',
      value: formatCurrency(totalIncome),
      icon: ArrowTrendingUpIcon,
      tone: 'success',
    },
    {
      label: 'Egresos del mes',
      value: formatCurrency(totalExpenses),
      icon: ArrowTrendingDownIcon,
      tone: 'danger',
    },
    {
      label: 'Deudas activas',
      value: formatCurrency(debtStatus?.total_debt || 0),
      icon: BanknotesIcon,
      tone: 'gold',
    },
    {
      label: 'Total ahorros',
      value: formatCurrency(savingsSummary?.total_balance || 0),
      icon: WalletIcon,
      tone: 'violet',
    },
  ]

  const toneMap = {
    success: { color: '#4cc38a', bg: 'rgba(76,195,138,0.1)' },
    danger: { color: '#e4635c', bg: 'rgba(228,99,92,0.1)' },
    gold: { color: '#e2b153', bg: 'rgba(226,177,83,0.1)' },
    violet: { color: '#b48cf0', bg: 'rgba(180,140,240,0.1)' },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="eyebrow">Resumen del mes · {monthLabel}</p>
          <h1 className="mt-2 text-4xl font-medium text-dark-800" style={{ fontFamily: 'Fraunces, serif' }}>
            Estado financiero
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

      {/* Hero: balance slip + savings rate */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 slip p-8 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#6f6a55', fontFamily: '"IBM Plex Mono", monospace' }}>
                Portal Financiero · Estado de cuenta
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em]" style={{ color: '#8a8168', fontFamily: '"IBM Plex Mono", monospace' }}>
                Balance neto del mes
              </p>
            </div>
            <div className="stamp w-20 h-20 sm:w-28 sm:h-28" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span>Verificado</span>
              <span>{today.getFullYear()}</span>
              <span>· Bóveda ·</span>
            </div>
          </div>

          <p
            className="fig mt-4 text-5xl xl:text-6xl font-semibold"
            style={{ color: balance >= 0 ? '#26281f' : '#a8442e' }}
          >
            {formatCurrency(balance)}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: balance >= 0 ? '#4a7a45' : '#a8442e', fontFamily: '"IBM Plex Mono", monospace' }}>
            {balance >= 0 ? '▲ Positivo este mes' : '▼ Negativo este mes'}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(38,40,31,0.18)' }}>
              <span className="text-[#6f6a55]">Ingresos</span>
              <span className="fig font-semibold" style={{ color: '#3d7a4a' }}>+ {formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(38,40,31,0.18)' }}>
              <span className="text-[#6f6a55]">Egresos</span>
              <span className="fig font-semibold" style={{ color: '#a8442e' }}>− {formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="card p-7 flex flex-col justify-center animate-slide-up" style={{ animationDelay: '80ms' }}>
          <p className="eyebrow">Tasa de ahorro</p>
          <p className="fig mt-3 text-5xl font-semibold text-success-500">{savingsRate}%</p>
          <p className="mt-1 text-sm text-dark-400">de tu ingreso se convierte en patrimonio</p>
          <div className="mt-6 w-full h-2.5 rounded-full bg-dark-100 border border-dark-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%`, background: 'linear-gradient(90deg, #b3872f, #e2b153)' }}
            />
          </div>
          <div className="mt-6 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Ingresos</span>
              <span className="fig font-semibold text-dark-800">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Egresos</span>
              <span className="fig font-semibold text-dark-800">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--line)' }}>
              <span className="text-dark-400">Balance neto</span>
              <span className={`fig font-bold ${balance >= 0 ? 'text-success-500' : 'text-danger-500'}`}>{formatCurrency(balance)}</span>
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
                className="w-11 h-11 rounded-xl flex items-center justify-center border"
                style={{ background: toneMap[stat.tone].bg, borderColor: 'var(--line)' }}
              >
                <stat.icon className="h-5 w-5" style={{ color: toneMap[stat.tone].color }} />
              </div>
              <span className="w-2 h-2 rounded-full" style={{ background: toneMap[stat.tone].color }} />
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-400" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
              {stat.label}
            </p>
            <p className="fig mt-1 text-2xl font-semibold text-dark-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-7 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="eyebrow">Evolución mensual</p>
              <h3 className="mt-1 text-xl text-dark-800" style={{ fontFamily: 'Fraunces, serif' }}>Ingresos vs egresos</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: GOLD }} />
                <span className="text-xs text-dark-400" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>INGRESOS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />
                <span className="text-xs text-dark-400" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>EGRESOS</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="card p-7 animate-slide-up" style={{ animationDelay: '180ms' }}>
          <p className="eyebrow">Liquidación del mes</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-100 border border-dark-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,195,138,0.1)' }}>
                  <ArrowTrendingUpIcon className="h-4 w-4 text-success-500" />
                </div>
                <span className="text-sm text-dark-400">Ingresos</span>
              </div>
              <span className="fig font-semibold text-success-500">{formatCurrency(totalIncome)}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-100 border border-dark-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(228,99,92,0.1)' }}>
                  <ArrowTrendingDownIcon className="h-4 w-4 text-danger-500" />
                </div>
                <span className="text-sm text-dark-400">Egresos</span>
              </div>
              <span className="fig font-semibold text-danger-500">{formatCurrency(totalExpenses)}</span>
            </div>

            <div className="p-5 rounded-xl" style={{ background: 'linear-gradient(180deg, #1f2637, #171c29)', border: '1px solid #2c3650' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-300">Balance neto</span>
                <span className={`fig text-2xl font-semibold ${balance >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-dark-500">Tasa de ahorro</span>
                  <span className="fig text-success-500 font-semibold">{savingsRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-dark-900 border border-dark-200 overflow-hidden" style={{ background: '#222a3c' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%`, background: 'linear-gradient(90deg, #2c7444, #4cc38a)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-7 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="eyebrow">Pasivo</p>
              <h3 className="mt-1 text-xl text-dark-800" style={{ fontFamily: 'Fraunces, serif' }}>Estado de deudas</h3>
            </div>
            <Link to="/debts" className="text-sm text-primary-500 hover:text-primary-400" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
              ver todas →
            </Link>
          </div>
          {debtStatus?.debts?.length > 0 ? (
            <div className="divide-y divide-dark-200">
              {debtStatus.debts.slice(0, 4).map((debt, index) => (
                <Link
                  key={debt.id}
                  to={`/debts/${debt.id}`}
                  className="flex items-center justify-between py-3.5 hover:bg-dark-100 transition-colors rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="fig text-xs text-dark-400 w-6">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-sm font-medium text-dark-800">{debt.name}</p>
                      <p className="text-xs text-dark-500" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{debt.bank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="fig text-sm font-semibold text-dark-800">{formatCurrency(debt.balance)}</p>
                    <p className="text-xs text-dark-500">{debt.remaining_months} meses</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <BanknotesIcon className="h-10 w-10 mx-auto text-dark-500 mb-3" />
              <p className="text-dark-400">No hay deudas activas</p>
            </div>
          )}
        </div>

        <div className="card p-7 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="eyebrow">Activo</p>
              <h3 className="mt-1 text-xl text-dark-800" style={{ fontFamily: 'Fraunces, serif' }}>Cuentas de ahorro</h3>
            </div>
            <Link to="/savings" className="text-sm text-primary-500 hover:text-primary-400" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
              ver todas →
            </Link>
          </div>
          {savingsSummary?.accounts?.length > 0 ? (
            <div className="divide-y divide-dark-200">
              {savingsSummary.accounts.slice(0, 4).map((account) => (
                <Link
                  key={account.id}
                  to={`/savings/${account.id}`}
                  className="flex items-center justify-between py-3.5 hover:bg-dark-100 transition-colors rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-dark-200" style={{ background: 'rgba(180,140,240,0.08)' }}>
                      <WalletIcon className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-800">{account.name}</p>
                      <p className="text-xs text-dark-500" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{account.bank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="fig text-sm font-semibold text-dark-800">{formatCurrency(account.balance)}</p>
                    {account.progress !== null && (
                      <p className="text-xs text-dark-500">{account.progress}% de meta</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <WalletIcon className="h-10 w-10 mx-auto text-dark-500 mb-3" />
              <p className="text-dark-400">No hay cuentas de ahorro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
