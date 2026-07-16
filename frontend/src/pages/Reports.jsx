import { useState, useEffect } from 'react'
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
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import api from '../services/api'
import { formatCurrency, getMonthName, getCurrentYear } from '../utils/formatters'
import toast from 'react-hot-toast'
import { DocumentChartBarIcon } from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function Reports() {
  const [activeTab, setActiveTab] = useState('cashflow')
  const [loading, setLoading] = useState(true)
  const [cashFlow, setCashFlow] = useState(null)
  const [monthlyEvolution, setMonthlyEvolution] = useState(null)
  const [debtStatus, setDebtStatus] = useState(null)
  const [savingsStatus, setSavingsStatus] = useState(null)
  const [interestProjection, setInterestProjection] = useState(null)
  const [year, setYear] = useState(getCurrentYear())

  useEffect(() => {
    fetchAllData()
  }, [year])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [cashFlowRes, evolutionRes, debtsRes, savingsRes, interestRes] = await Promise.all([
        api.get('/reports/cash-flow'),
        api.get(`/reports/monthly-evolution?year=${year}`),
        api.get('/reports/debt-status'),
        api.get('/reports/savings-status'),
        api.get('/reports/interest-projection?months=12'),
      ])
      setCashFlow(cashFlowRes.data)
      setMonthlyEvolution(evolutionRes.data)
      setDebtStatus(debtsRes.data)
      setSavingsStatus(savingsRes.data)
      setInterestProjection(interestRes.data)
    } catch (error) {
      toast.error('Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'cashflow', name: 'Flujo de Caja' },
    { id: 'evolution', name: 'Evolución Mensual' },
    { id: 'debts', name: 'Estado de Deudas' },
    { id: 'savings', name: 'Estado de Ahorros' },
    { id: 'interests', name: 'Proyección de Intereses' },
  ]

  const monthlyEvolutionData = {
    labels: monthlyEvolution?.data?.map(d => getMonthName(d.month)) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyEvolution?.data?.map(d => d.income) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Egresos',
        data: monthlyEvolution?.data?.map(d => d.expenses) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Balance Neto',
        data: monthlyEvolution?.data?.map(d => d.net) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  }

  const savingsDoughnutData = {
    labels: savingsStatus?.accounts?.map(a => a.name) || [],
    datasets: [
      {
        data: savingsStatus?.accounts?.map(a => a.balance) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(34, 197, 94, 0.5)',
          'rgba(239, 68, 68, 0.5)',
          'rgba(168, 85, 247, 0.5)',
          'rgba(249, 115, 22, 0.5)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Análisis detallado de tus finanzas</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-600">Año:</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={getCurrentYear() - 1}>{getCurrentYear() - 1}</option>
            <option value={getCurrentYear()}>{getCurrentYear()}</option>
            <option value={getCurrentYear() + 1}>{getCurrentYear() + 1}</option>
          </select>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'cashflow' && cashFlow && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-500">Ingresos</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(cashFlow.income)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Egresos</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(cashFlow.expenses)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Pagos Deudas</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(cashFlow.debt_payments)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Depósitos Ahorro</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(cashFlow.savings_deposits)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Flujo Neto</p>
              <p className={`text-xl font-bold ${cashFlow.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlow.net_flow)}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evolution' && (
        <div className="card p-6">
          <Line data={monthlyEvolutionData} options={chartOptions} />
        </div>
      )}

      {activeTab === 'debts' && debtStatus && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-500">Total Deudas</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(debtStatus.total_debt)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Pago Mensual Total</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(debtStatus.total_monthly_payment)}</p>
            </div>
          </div>
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Banco
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pago Mensual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tasa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Meses Rest.
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debtStatus.debts.map((debt) => (
                  <tr key={debt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {debt.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {debt.bank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(debt.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(debt.monthly_payment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {debt.interest_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {debt.remaining_months}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'savings' && savingsStatus && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-500">Balance Total</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(savingsStatus.total_balance)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Meta Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(savingsStatus.total_goal)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Progreso General</p>
              <p className="text-2xl font-bold text-primary-600">{savingsStatus.overall_progress || 0}%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Ahorros</h3>
              <div className="h-64">
                <Doughnut data={savingsDoughnutData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalle por Cuenta</h3>
              <div className="space-y-4">
                {savingsStatus.accounts.map((account) => (
                  <div key={account.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{account.name}</span>
                      <span className="text-sm text-gray-500">{account.bank}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-purple-600">
                        {formatCurrency(account.balance)}
                      </span>
                      {account.progress !== null && (
                        <span className="text-sm text-gray-500">{account.progress}% de meta</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'interests' && interestProjection && (
        <div className="space-y-6">
          {interestProjection.debts?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Proyección de Intereses en Deudas</h3>
              <div className="space-y-6">
                {interestProjection.debts.map((debt) => (
                  <div key={debt.debt_id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{debt.debt_name}</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left">Mes</th>
                            <th className="px-3 py-2 text-left">Capital</th>
                            <th className="px-3 py-2 text-left">Interés</th>
                            <th className="px-3 py-2 text-left">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debt.projections.slice(0, 6).map((p) => (
                            <tr key={p.month} className="border-t">
                              <td className="px-3 py-2">{p.month}</td>
                              <td className="px-3 py-2 text-green-600">{formatCurrency(p.capital)}</td>
                              <td className="px-3 py-2 text-red-600">{formatCurrency(p.interest)}</td>
                              <td className="px-3 py-2">{formatCurrency(p.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {interestProjection.savings?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Proyección de Intereses en Ahorros</h3>
              <div className="space-y-6">
                {interestProjection.savings.map((savings) => (
                  <div key={savings.savings_id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{savings.savings_name}</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left">Mes</th>
                            <th className="px-3 py-2 text-left">Intereses Generados</th>
                            <th className="px-3 py-2 text-left">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {savings.projections.slice(0, 6).map((p) => (
                            <tr key={p.month} className="border-t">
                              <td className="px-3 py-2">{p.month}</td>
                              <td className="px-3 py-2 text-green-600">{formatCurrency(p.interest)}</td>
                              <td className="px-3 py-2">{formatCurrency(p.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
