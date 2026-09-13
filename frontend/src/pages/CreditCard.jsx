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
import toast from 'react-hot-toast'
import {
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

function defaultDueDate() {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 20)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const newRow = () => ({
  description: '',
  mode: 'total',
  totalAmount: '',
  totalInstallments: '',
  paidInstallments: '0',
  pendingCapital: '',
  remainingMonths: '',
  monthlyRate: '2.16',
})

export default function CreditCard() {
  const [method, setMethod] = useState('linear')
  const [firstDueDate, setFirstDueDate] = useState(defaultDueDate())
  const [rows, setRows] = useState([newRow()])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const updateRow = (i, field, value) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  const addRow = () => setRows((prev) => [...prev, newRow()])
  const removeRow = (i) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))

  const calculate = async () => {
    const purchases = rows
      .map((r) => {
        const base = {
          description: r.description || 'Compra',
          monthlyRate: parseFloat(r.monthlyRate) || 0,
        }
        if (r.mode === 'pending') {
          return {
            ...base,
            pendingCapital: parseFloat(r.pendingCapital) || 0,
            remainingMonths: parseInt(r.remainingMonths, 10) || 0,
          }
        }
        return {
          ...base,
          totalAmount: parseFloat(r.totalAmount) || 0,
          totalInstallments: parseInt(r.totalInstallments, 10) || 0,
          paidInstallments: parseInt(r.paidInstallments, 10) || 0,
        }
      })
      .filter((p) => (p.pendingCapital > 0) || (p.totalAmount > 0 && p.totalInstallments > 0))

    if (!purchases.length) {
      toast.error('Agrega al menos una compra con monto o saldo pendiente')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/credit-card/plan', { method, firstDueDate, purchases })
      setResult(res.data)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al calcular el plan')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setRows([newRow()])
    setResult(null)
  }

  const active = result?.results?.[method]
  const comparison = result?.comparison

  const step = active?.months?.length ? Math.max(1, Math.ceil(active.months.length / 8)) : 1
  const chartMonths = active?.months?.filter((_, i) => i % step === 0 || i === active.months.length - 1) || []
  const labels = chartMonths.map((m) => m.label)

  const barChartData = {
    labels,
    datasets: [
      { label: 'Capital', data: chartMonths.map((m) => m.capital), backgroundColor: 'rgba(14, 165, 233, 0.8)', borderRadius: 6 },
      { label: 'Intereses', data: chartMonths.map((m) => m.interest), backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 6 },
    ],
  }
  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'Saldo',
        data: chartMonths.map((m) => m.balance),
        borderColor: '#1B8A8F',
        backgroundColor: 'rgba(27, 138, 143, 0.12)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#1B8A8F',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
      },
    ],
  }
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#7c8698', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#7c8698', font: { size: 11 }, callback: (v) => '$' + v.toLocaleString() },
      },
    },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-dark-900">Tarjeta de crédito</h1>
        <p className="text-dark-500 mt-1">
          Analiza tus compras cuotificadas y simula compras nuevas con el cálculo exacto de la tarjeta
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="xl:col-span-1 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                <CreditCardIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-dark-900">Compras a cuotas</h3>
                <p className="text-sm text-dark-500">Una fila por compra del extracto o nueva</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="input-label">Método de amortización</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('linear')}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${method === 'linear' ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-dark-600 border-dark-200 hover:bg-dark-50'}`}
                  >
                    Capital fijo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('annuity')}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${method === 'annuity' ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-dark-600 border-dark-200 hover:bg-dark-50'}`}
                  >
                    Cuota fija
                  </button>
                </div>
                <p className="text-xs text-dark-400 mt-1.5">
                  {method === 'linear'
                    ? 'Capital fijo: abona monto ÷ cuotas cada mes + interés sobre el saldo (así factura RappiCard). Cuota decreciente.'
                    : 'Cuota fija: pago igual cada mes (anualidad francesa).'}
                </p>
              </div>

              <div>
                <label className="input-label">Fecha del primer pago</label>
                <input
                  type="date"
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {rows.map((row, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-dark-700">Compra {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateRow(i, 'mode', row.mode === 'total' ? 'pending' : 'total')}
                      className="text-xs font-semibold text-primary-600 hover:underline"
                      title="Cambiar forma de ingreso"
                    >
                      {row.mode === 'total' ? 'Usar saldo pendiente' : 'Usar monto y cuotas'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={rows.length === 1}
                      className="p-1.5 rounded-lg text-dark-400 hover:text-danger-500 hover:bg-danger-50 disabled:opacity-30"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(i, 'description', e.target.value)}
                    placeholder="Descripción (ej: Amazon)"
                    className="input-field"
                  />

                  {row.mode === 'total' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-3">
                        <label className="input-label text-xs">Monto total</label>
                        <input
                          type="number"
                          value={row.totalAmount}
                          onChange={(e) => updateRow(i, 'totalAmount', e.target.value)}
                          placeholder="0"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="input-label text-xs">Cuotas</label>
                        <input
                          type="number"
                          value={row.totalInstallments}
                          onChange={(e) => updateRow(i, 'totalInstallments', e.target.value)}
                          placeholder="12"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="input-label text-xs">Ya pagadas</label>
                        <input
                          type="number"
                          value={row.paidInstallments}
                          onChange={(e) => updateRow(i, 'paidInstallments', e.target.value)}
                          placeholder="0"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="input-label text-xs">Tasa % M.V</label>
                        <input
                          type="number"
                          step="0.01"
                          value={row.monthlyRate}
                          onChange={(e) => updateRow(i, 'monthlyRate', e.target.value)}
                          placeholder="2.16"
                          className="input-field"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-3">
                        <label className="input-label text-xs">Capital pendiente</label>
                        <input
                          type="number"
                          value={row.pendingCapital}
                          onChange={(e) => updateRow(i, 'pendingCapital', e.target.value)}
                          placeholder="0"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="input-label text-xs">Meses restantes</label>
                        <input
                          type="number"
                          value={row.remainingMonths}
                          onChange={(e) => updateRow(i, 'remainingMonths', e.target.value)}
                          placeholder="6"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="input-label text-xs">Tasa % M.V</label>
                        <input
                          type="number"
                          step="0.01"
                          value={row.monthlyRate}
                          onChange={(e) => updateRow(i, 'monthlyRate', e.target.value)}
                          placeholder="2.16"
                          className="input-field"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={addRow} className="btn-secondary w-full">
              <PlusIcon className="h-5 w-5 mr-2" />
              Agregar compra
            </button>

            <div className="flex gap-3">
              <button onClick={calculate} disabled={loading} className="flex-1 btn-primary disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Calcular plan'}
              </button>
              <button onClick={reset} className="btn-secondary">
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="xl:col-span-2 space-y-6">
          {!active ? (
            <div className="card p-12 text-center">
              <div className="w-20 h-20 bg-dark-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="h-10 w-10 text-dark-400" />
              </div>
              <h3 className="text-lg font-display font-bold text-dark-900 mb-2">Ingresa tus compras</h3>
              <p className="text-dark-500 max-w-md mx-auto">
                Agrega cada compra cuotificada (monto, cuotas, cuotas ya pagadas y tasa) y las compras nuevas.
                Calcularemos cuánto pagas cada mes con exactitud.
              </p>
            </div>
          ) : (
            <>
              {/* Comparación de métodos */}
              {comparison && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <InformationCircleIcon className="h-5 w-5 text-primary-600" />
                    <h3 className="font-display font-bold text-dark-900">Comparación de métodos</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-50">
                        <tr>
                          <th className="table-header">Método</th>
                          <th className="table-header text-right">Próximo pago</th>
                          <th className="table-header text-right">Total a pagar</th>
                          <th className="table-header text-right">Intereses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-100">
                        {['linear', 'annuity'].map((m) => (
                          <tr key={m} className={m === method ? 'bg-primary-50' : ''}>
                            <td className="table-cell font-medium">
                              {m === 'linear' ? 'Capital fijo' : 'Cuota fija'}
                              {m === method && <span className="badge badge-primary ml-2">Elegido</span>}
                              {comparison.lowerInterest === m && <span className="badge badge-success ml-2">Menos intereses</span>}
                            </td>
                            <td className="table-cell text-right">{formatCurrency(comparison[m].nextPayment)}</td>
                            <td className="table-cell text-right font-semibold">{formatCurrency(comparison[m].totalToPay)}</td>
                            <td className="table-cell text-right text-danger-600 font-medium">{formatCurrency(comparison[m].totalInterest)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-dark-400 mt-3">
                    El capital fijo abona más capital al inicio, por eso paga menos intereses totales que la cuota fija.
                  </p>
                </div>
              )}

              {/* Resumen */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5">
                  <p className="text-sm text-dark-500 mb-1">Deuda pendiente</p>
                  <p className="text-2xl font-bold text-dark-900">{formatCurrency(active.summary.pendingCapital)}</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-dark-500 mb-1">Próximo pago</p>
                  <p className="text-2xl font-bold text-primary-600">{formatCurrency(active.summary.nextPayment)}</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-dark-500 mb-1">Total a pagar</p>
                  <p className="text-2xl font-bold text-dark-900">{formatCurrency(active.summary.totalToPay)}</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-dark-500 mb-1">Intereses totales</p>
                  <p className="text-2xl font-bold text-danger-600">{formatCurrency(active.summary.totalInterest)}</p>
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
                  <h4 className="font-display font-bold text-dark-900 mb-4">Evolución del saldo</h4>
                  <div className="h-64">
                    <Line data={lineChartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* Tabla mes a mes */}
              <div className="card overflow-hidden">
                <div className="p-6 border-b border-dark-100 flex items-center justify-between">
                  <h4 className="font-display font-bold text-dark-900">Plan mes a mes</h4>
                  <span className="text-sm text-dark-500">{active.summary.maxMonths} meses</span>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-dark-50 sticky top-0">
                      <tr>
                        <th className="table-header">Mes</th>
                        <th className="table-header text-right">Capital</th>
                        <th className="table-header text-right">Interés</th>
                        <th className="table-header text-right">Cuota</th>
                        <th className="table-header text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                      {active.months.map((m) => (
                        <tr key={m.month} className="hover:bg-dark-50 transition-colors">
                          <td className="table-cell font-medium">{m.label}</td>
                          <td className="table-cell text-right text-primary-600 font-medium">{formatCurrency(m.capital)}</td>
                          <td className="table-cell text-right text-danger-600 font-medium">{formatCurrency(m.interest)}</td>
                          <td className="table-cell text-right font-bold">{formatCurrency(m.payment)}</td>
                          <td className="table-cell text-right font-semibold">{formatCurrency(m.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Desglose por compra */}
              <div className="card overflow-hidden">
                <div className="p-6 border-b border-dark-100">
                  <h4 className="font-display font-bold text-dark-900">Desglose por compra</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-50">
                      <tr>
                        <th className="table-header">Compra</th>
                        <th className="table-header text-right">Capital pendiente</th>
                        <th className="table-header text-right">Meses</th>
                        <th className="table-header text-right">Capital/mes</th>
                        <th className="table-header text-right">Tasa M.V</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                      {active.purchases.map((p, i) => (
                        <tr key={i} className="hover:bg-dark-50 transition-colors">
                          <td className="table-cell font-medium">{p.description}</td>
                          <td className="table-cell text-right">{formatCurrency(p.pendingCapital)}</td>
                          <td className="table-cell text-right">{p.remaining}</td>
                          <td className="table-cell text-right">{formatCurrency(p.perMonth)}</td>
                          <td className="table-cell text-right text-dark-500">{p.monthlyRatePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
