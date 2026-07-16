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
import { Line, Doughnut } from 'react-chartjs-2'
import api from '../services/api'
import { formatCurrency, getMonthName } from '../utils/formatters'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  WalletIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
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
          <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-primary-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
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
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Egresos',
        data: monthlyData?.data.map(d => d.expenses) || [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
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
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
          callback: (value) => '$' + value.toLocaleString(),
        },
      },
    },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Dashboard</h1>
          <p className="text-dark-500 mt-1">Resumen de tu situación financiera</p>
        </div>
        <div className="flex gap-3">
          <Link to="/incomes" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Ingreso
          </Link>
          <Link to="/expenses" className="btn-secondary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Egreso
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="stat-card animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="stat-icon bg-success-100">
            <ArrowTrendingUpIcon className="h-6 w-6 text-success-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-dark-500">Ingresos del Mes</p>
            <p className="text-2xl font-bold text-dark-900">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="flex items-center text-success-600 text-sm font-medium">
            <ArrowUpRightIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="stat-icon bg-danger-100">
            <ArrowTrendingDownIcon className="h-6 w-6 text-danger-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-dark-500">Egresos del Mes</p>
            <p className="text-2xl font-bold text-dark-900">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="flex items-center text-danger-600 text-sm font-medium">
            <ArrowDownRightIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="stat-icon bg-primary-100">
            <BanknotesIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-dark-500">Deudas Activas</p>
            <p className="text-2xl font-bold text-dark-900">
              {formatCurrency(debtStatus?.total_debt || 0)}
            </p>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="stat-icon bg-purple-100">
            <WalletIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-dark-500">Total Ahorros</p>
            <p className="text-2xl font-bold text-dark-900">
              {formatCurrency(savingsSummary?.total_balance || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display font-bold text-dark-900">Evolución Mensual</h3>
              <p className="text-sm text-dark-500">Ingresos vs Egresos</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500"></div>
                <span className="text-xs text-dark-500">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger-500"></div>
                <span className="text-xs text-dark-500">Egresos</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-display font-bold text-dark-900 mb-6">Balance del Mes</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-success-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-success-600" />
                </div>
                <span className="font-medium text-dark-700">Ingresos</span>
              </div>
              <span className="font-bold text-success-600">{formatCurrency(totalIncome)}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-danger-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center">
                  <ArrowTrendingDownIcon className="h-5 w-5 text-danger-600" />
                </div>
                <span className="font-medium text-dark-700">Egresos</span>
              </div>
              <span className="font-bold text-danger-600">{formatCurrency(totalExpenses)}</span>
            </div>
            
            <div className="p-4 bg-dark-900 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">Balance Neto</span>
                <span className={`text-xl font-bold ${balance >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-dark-400">Tasa de ahorro</span>
                  <span className="text-white font-medium">{savingsRate}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-success-400 to-success-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-bold text-dark-900">Estado de Deudas</h3>
            <Link to="/debts" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Ver todas →
            </Link>
          </div>
          {debtStatus?.debts?.length > 0 ? (
            <div className="space-y-3">
              {debtStatus.debts.slice(0, 4).map((debt, index) => (
                <Link
                  key={debt.id}
                  to={`/debts/${debt.id}`}
                  className="flex items-center justify-between p-4 bg-dark-50 rounded-2xl hover:bg-dark-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-dark-900">{debt.name}</p>
                      <p className="text-xs text-dark-500">{debt.bank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark-900">{formatCurrency(debt.balance)}</p>
                    <p className="text-xs text-dark-500">{debt.remaining_months} meses</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BanknotesIcon className="h-12 w-12 mx-auto text-dark-300 mb-3" />
              <p className="text-dark-500">No hay deudas activas</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-bold text-dark-900">Cuentas de Ahorro</h3>
            <Link to="/savings" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Ver todas →
            </Link>
          </div>
          {savingsSummary?.accounts?.length > 0 ? (
            <div className="space-y-3">
              {savingsSummary.accounts.slice(0, 4).map((account) => (
                <Link
                  key={account.id}
                  to={`/savings/${account.id}`}
                  className="flex items-center justify-between p-4 bg-dark-50 rounded-2xl hover:bg-dark-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <WalletIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-900">{account.name}</p>
                      <p className="text-xs text-dark-500">{account.bank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark-900">{formatCurrency(account.balance)}</p>
                    {account.progress !== null && (
                      <p className="text-xs text-dark-500">{account.progress}% de meta</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <WalletIcon className="h-12 w-12 mx-auto text-dark-300 mb-3" />
              <p className="text-dark-500">No hay cuentas de ahorro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
