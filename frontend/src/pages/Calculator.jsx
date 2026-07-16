import { useState } from 'react'
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
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { CalculatorIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export default function Calculator() {
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('')
  const [months, setMonths] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const calculate = async () => {
    if (!amount || !rate || !months) return
    setLoading(true)
    try {
      const res = await api.get(`/debts/calculator?amount=${amount}&rate=${rate}&months=${months}`)
      setResult(res.data)
    } catch (error) {
      console.error('Error calculating:', error)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setAmount('')
    setRate('')
    setMonths('')
    setResult(null)
  }

  const barChartData = {
    labels: result?.amortization?.filter((_, i) => i % 3 === 0 || i === result.amortization.length - 1).map(p => `Mes ${p.month}`) || [],
    datasets: [
      {
        label: 'Capital',
        data: result?.amortization?.filter((_, i) => i % 3 === 0 || i === result.amortization.length - 1).map(p => p.capital) || [],
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Intereses',
        data: result?.amortization?.filter((_, i) => i % 3 === 0 || i === result.amortization.length - 1).map(p => p.interest) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 6,
      },
    ],
  }

  const lineChartData = {
    labels: result?.amortization?.filter((_, i) => i % 3 === 0 || i === result.amortization.length - 1).map(p => `Mes ${p.month}`) || [],
    datasets: [
      {
        label: 'Saldo Restante',
        data: result?.amortization?.filter((_, i) => i % 3 === 0 || i === result.amortization.length - 1).map(p => p.balance) || [],
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0ea5e9',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        ticks: { 
          color: '#64748b', 
          font: { size: 11 },
          callback: (value) => '$' + value.toLocaleString(),
        },
      },
    },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-dark-900">Calculadora de Crédito</h1>
        <p className="text-dark-500 mt-1">Calcula tus cuotas mensuales y visualiza el plan de amortización</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="xl:col-span-1">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                <CalculatorIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-dark-900">Datos del Préstamo</h3>
                <p className="text-sm text-dark-500">Ingresa los valores para calcular</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="input-label">Monto del Préstamo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-field pl-8 text-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Tasa de Interés Anual</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0.0"
                    className="input-field pr-8 text-lg font-semibold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">%</span>
                </div>
              </div>

              <div>
                <label className="input-label">Plazo en Meses</label>
                <input
                  type="number"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  placeholder="12"
                  className="input-field text-lg font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={calculate}
                  disabled={!amount || !rate || !months || loading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Calcular'
                  )}
                </button>
                <button onClick={reset} className="btn-secondary">
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="xl:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5">
                  <p className="text-sm text-dark-500 mb-1">Cuota Mensual</p>
                  <p className="text-2xl font-bold text-primary-600">{formatCurrency(result.result.monthlyPayment)}</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-dark-500 mb-1">Total a Pagar</p>
                  <p className="text-2xl font-bold text-dark-900">{formatCurrency(result.result.totalPayment)}</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-dark-500 mb-1">Total Intereses</p>
                  <p className="text-2xl font-bold text-danger-600">{formatCurrency(result.result.totalInterest)}</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-dark-500 mb-1">% Intereses</p>
                  <p className="text-2xl font-bold text-warning-600">{result.result.interestPercentage}%</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h4 className="font-display font-bold text-dark-900 mb-4">Capital vs Intereses</h4>
                  <div className="h-64">
                    <Bar data={barChartData} options={chartOptions} />
                  </div>
                </div>
                <div className="card p-6">
                  <h4 className="font-display font-bold text-dark-900 mb-4">Evolución del Saldo</h4>
                  <div className="h-64">
                    <Line data={lineChartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* Amortization Table */}
              <div className="card overflow-hidden">
                <div className="p-6 border-b border-dark-100">
                  <h4 className="font-display font-bold text-dark-900">Tabla de Amortización</h4>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-dark-50 sticky top-0">
                      <tr>
                        <th className="table-header">Mes</th>
                        <th className="table-header">Cuota</th>
                        <th className="table-header">Capital</th>
                        <th className="table-header">Interés</th>
                        <th className="table-header">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                      {result.amortization.map((row) => (
                        <tr key={row.month} className="hover:bg-dark-50 transition-colors">
                          <td className="table-cell font-medium">{row.month}</td>
                          <td className="table-cell">{formatCurrency(row.payment)}</td>
                          <td className="table-cell text-primary-600 font-medium">{formatCurrency(row.capital)}</td>
                          <td className="table-cell text-danger-600 font-medium">{formatCurrency(row.interest)}</td>
                          <td className="table-cell font-semibold">{formatCurrency(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <div className="w-20 h-20 bg-dark-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CalculatorIcon className="h-10 w-10 text-dark-400" />
              </div>
              <h3 className="text-lg font-display font-bold text-dark-900 mb-2">Ingresa los datos del préstamo</h3>
              <p className="text-dark-500 max-w-md mx-auto">
                Completa el formulario con el monto, tasa de interés y plazo para ver el desglose de tu crédito
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
