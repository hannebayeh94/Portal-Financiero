import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export default function DebtDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [debt, setDebt] = useState(null)
  const [projection, setProjection] = useState(null)
  const [cyclesData, setCyclesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showChargeModal, setShowChargeModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
  })
  const [chargeData, setChargeData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [editPaymentData, setEditPaymentData] = useState({
    amount: '',
    payment_date: '',
  })
  const [editData, setEditData] = useState({
    name: '',
    total_amount: '',
    interest_rate: '',
    interest_type: 'fixed',
    monthly_payment: '',
    term_months: '',
    remaining_months: '',
    start_date: '',
    end_date: '',
    bank_or_lender: '',
    payment_day: '',
    cut_day: '',
    status: 'active',
  })

  useEffect(() => {
    fetchDebtData()
  }, [id])

  const fetchDebtData = async () => {
    try {
      const [debtRes, projectionRes, cyclesRes] = await Promise.all([
        api.get(`/debts/${id}`),
        api.get(`/debts/${id}/projection`),
        api.get(`/debts/${id}/cycles`),
      ])
      setDebt(debtRes.data)
      setProjection(projectionRes.data)
      setCyclesData(cyclesRes.data)
    } catch (error) {
      toast.error('Error al cargar datos de la deuda')
      navigate('/debts')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/debts/${id}/payments`, paymentData)
      toast.success('Pago registrado')
      setShowPaymentModal(false)
      setPaymentData({ amount: '', payment_date: new Date().toISOString().split('T')[0] })
      fetchDebtData()
    } catch (error) {
      toast.error('Error al registrar pago')
    }
  }

  const handleCharge = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/debts/${id}/charges`, chargeData)
      toast.success('Consumo registrado')
      setShowChargeModal(false)
      setChargeData({ amount: '', payment_date: new Date().toISOString().split('T')[0], description: '' })
      fetchDebtData()
    } catch (error) {
      toast.error('Error al registrar consumo')
    }
  }

  const handleEdit = () => {
    setEditData({
      name: debt.name,
      total_amount: debt.total_amount,
      interest_rate: debt.interest_rate,
      interest_type: debt.interest_type,
      monthly_payment: debt.monthly_payment,
      term_months: debt.term_months,
      remaining_months: debt.remaining_months,
      start_date: debt.start_date.split('T')[0],
      end_date: debt.end_date.split('T')[0],
      bank_or_lender: debt.bank_or_lender,
      payment_day: debt.payment_day != null ? String(debt.payment_day) : '',
      cut_day: debt.cut_day != null ? String(debt.cut_day) : '',
      status: debt.status,
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/debts/${id}`, editData)
      toast.success('Deuda actualizada')
      setShowEditModal(false)
      fetchDebtData()
    } catch (error) {
      toast.error('Error al actualizar deuda')
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta deuda?')) return
    try {
      await api.delete(`/debts/${id}`)
      toast.success('Deuda eliminada')
      navigate('/debts')
    } catch (error) {
      toast.error('Error al eliminar deuda')
    }
  }

  const handleEditPayment = (payment) => {
    setEditingPayment(payment)
    setEditPaymentData({
      amount: payment.amount,
      payment_date: payment.payment_date.split('T')[0],
    })
    setShowEditPaymentModal(true)
  }

  const handleUpdatePayment = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/debts/${id}/payments/${editingPayment.id}`, editPaymentData)
      toast.success('Pago actualizado')
      setShowEditPaymentModal(false)
      setEditingPayment(null)
      fetchDebtData()
    } catch (error) {
      toast.error('Error al actualizar pago')
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('¿Estás seguro de eliminar este pago?')) return
    try {
      await api.delete(`/debts/${id}/payments/${paymentId}`)
      toast.success('Pago eliminado')
      fetchDebtData()
    } catch (error) {
      toast.error('Error al eliminar pago')
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

  if (!debt) return null

  const barChartData = {
    labels: projection?.projection?.filter((_, i) => i % 2 === 0 || i === projection.projection.length - 1).map(p => `Mes ${p.month}`) || [],
    datasets: [
      {
        label: 'Capital',
        data: projection?.projection?.filter((_, i) => i % 2 === 0 || i === projection.projection.length - 1).map(p => p.capital) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Intereses',
        data: projection?.projection?.filter((_, i) => i % 2 === 0 || i === projection.projection.length - 1).map(p => p.interest) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 6,
      },
    ],
  }

  const lineChartData = {
    labels: projection?.projection?.filter((_, i) => i % 2 === 0 || i === projection.projection.length - 1).map(p => `Mes ${p.month}`) || [],
    datasets: [
      {
        label: 'Saldo Restante',
        data: projection?.projection?.filter((_, i) => i % 2 === 0 || i === projection.projection.length - 1).map(p => p.remaining_balance) || [],
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

  const paidPercentage = ((parseFloat(debt.total_amount) - parseFloat(debt.current_balance)) / parseFloat(debt.total_amount)) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/debts')}
            className="p-2 hover:bg-dark-100 rounded-xl transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-dark-600" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900">{debt.name}</h1>
            <p className="text-dark-500">{debt.bank_or_lender}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleEdit} className="btn-secondary">
            <PencilIcon className="h-5 w-5 mr-2" />
            Editar
          </button>
          <button onClick={handleDelete} className="btn-danger">
            <TrashIcon className="h-5 w-5 mr-2" />
            Eliminar
          </button>
          <button onClick={() => setShowChargeModal(true)} className="btn-secondary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Agregar Consumo
          </button>
          <button onClick={() => setShowPaymentModal(true)} className="btn-success">
            <PlusIcon className="h-5 w-5 mr-2" />
            Registrar Pago
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-dark-500 mb-1">Saldo Actual</p>
          <p className="text-2xl font-bold text-dark-900">{formatCurrency(debt.current_balance)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-dark-500 mb-1">Pago Mensual</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(debt.monthly_payment)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-dark-500 mb-1">Tasa de Interés</p>
          <p className="text-2xl font-bold text-dark-900">{debt.interest_rate}%</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-dark-500 mb-1">Meses Restantes</p>
          <p className="text-2xl font-bold text-dark-900">{debt.remaining_months}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-dark-500">Progreso de pago</span>
          <span className="text-sm font-bold text-dark-900">{Math.round(paidPercentage)}%</span>
        </div>
        <div className="w-full bg-dark-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-success-500 to-success-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${paidPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-dark-500">
          <span>Pagado: {formatCurrency(parseFloat(debt.total_amount) - parseFloat(debt.current_balance))}</span>
          <span>Total: {formatCurrency(debt.total_amount)}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-display font-bold text-dark-900 mb-4">Capital vs Intereses</h3>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-display font-bold text-dark-900 mb-4">Evolución del Saldo</h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Summary */}
      {projection?.summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-display font-bold text-dark-900 mb-4">Resumen del Próximo Pago</h3>
            {projection.projection[0] && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-dark-50 rounded-xl">
                  <span className="text-dark-600">Pago total</span>
                  <span className="font-bold text-lg">{formatCurrency(projection.projection[0].payment)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-success-50 rounded-xl">
                  <span className="text-dark-600">Capital</span>
                  <span className="font-bold text-success-600">{formatCurrency(projection.projection[0].capital)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-danger-50 rounded-xl">
                  <span className="text-dark-600">Intereses</span>
                  <span className="font-bold text-danger-600">{formatCurrency(projection.projection[0].interest)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-primary-50 rounded-xl">
                  <span className="text-dark-600">Saldo después del pago</span>
                  <span className="font-bold text-primary-600">{formatCurrency(projection.projection[0].remaining_balance)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-display font-bold text-dark-900 mb-4">Total a Pagar</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-dark-50 rounded-xl">
                <span className="text-dark-600">Total pagos restantes</span>
                <span className="font-bold text-lg">{formatCurrency(projection.summary.totalPayments)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-danger-50 rounded-xl">
                <span className="text-dark-600">Total intereses</span>
                <span className="font-bold text-danger-600">{formatCurrency(projection.summary.totalInterest)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-success-50 rounded-xl">
                <span className="text-dark-600">Total capital</span>
                <span className="font-bold text-success-600">{formatCurrency(projection.summary.totalCapital)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="card p-6">
        <h3 className="text-lg font-display font-bold text-dark-900 mb-4">Historial de Movimientos</h3>
        {debt.payments?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50">
                <tr>
                  <th className="table-header">Fecha</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Capital</th>
                  <th className="table-header">Interés</th>
                  <th className="table-header">Saldo</th>
                  <th className="table-header text-right">Monto</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {debt.payments.map((payment) => {
                  const isCharge = payment.type === 'charge'
                  return (
                  <tr key={payment.id} className="hover:bg-dark-50 transition-colors">
                    <td className="table-cell">{formatDate(payment.payment_date)}</td>
                    <td className="table-cell">
                      <span className={`badge ${isCharge ? 'badge-danger' : 'badge-success'}`}>
                        {isCharge ? 'Consumo' : 'Abono'}
                      </span>
                    </td>
                    <td className="table-cell text-success-600 font-medium">{isCharge ? '—' : formatCurrency(payment.capital_portion)}</td>
                    <td className="table-cell text-danger-600 font-medium">{isCharge ? '—' : formatCurrency(payment.interest_portion)}</td>
                    <td className="table-cell font-semibold">{formatCurrency(payment.remaining_balance)}</td>
                    <td className={`table-cell text-right font-bold ${isCharge ? 'text-danger-600' : 'text-dark-900'}`}>{isCharge ? '+' : '−'}{formatCurrency(payment.amount)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditPayment(payment)}
                          className="p-1.5 hover:bg-dark-100 rounded-lg transition-colors"
                        >
                          <PencilIcon className="h-4 w-4 text-dark-500" />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4 text-danger-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-dark-500">No hay pagos registrados</p>
          </div>
        )}
      </div>

      {/* Billing cycles */}
      {cyclesData?.cycles?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-display font-bold text-dark-900">Ciclos de corte</h3>
            {cyclesData.summary?.cutDay ? (
              <span className="text-sm text-dark-500">
                Corte día {cyclesData.summary.cutDay} · Pago día {cyclesData.summary.dueDay || '—'}
              </span>
            ) : (
              <span className="text-sm text-dark-400">Sin día de corte (ciclo mensual)</span>
            )}
          </div>
          <p className="text-sm text-dark-500 mb-4">
            Interés generado y movimientos consolidados por ciclo, desde la deuda original ({formatCurrency(cyclesData.summary.originalDebt)}).
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="p-4 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-500 mb-1">Deuda original</p>
              <p className="text-lg font-bold text-dark-900">{formatCurrency(cyclesData.summary.originalDebt)}</p>
            </div>
            <div className="p-4 bg-danger-50 rounded-xl">
              <p className="text-xs text-dark-500 mb-1">Interés total generado</p>
              <p className="text-lg font-bold text-danger-600">{formatCurrency(cyclesData.summary.totalInterest)}</p>
            </div>
            <div className="p-4 bg-warning-50 rounded-xl">
              <p className="text-xs text-dark-500 mb-1">Consumos</p>
              <p className="text-lg font-bold text-dark-900">{formatCurrency(cyclesData.summary.totalCharges)}</p>
            </div>
            <div className="p-4 bg-success-50 rounded-xl">
              <p className="text-xs text-dark-500 mb-1">Abonos</p>
              <p className="text-lg font-bold text-success-600">{formatCurrency(cyclesData.summary.totalPayments)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50">
                <tr>
                  <th className="table-header">Ciclo</th>
                  <th className="table-header">Corte</th>
                  <th className="table-header">Vence</th>
                  <th className="table-header text-right">Saldo inicial</th>
                  <th className="table-header text-right">Interés</th>
                  <th className="table-header text-right">Consumos</th>
                  <th className="table-header text-right">Abonos</th>
                  <th className="table-header text-right">Saldo cierre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {cyclesData.cycles.map((c, i) => (
                  <tr key={i} className={`hover:bg-dark-50 transition-colors ${i === cyclesData.summary.currentIndex ? 'bg-primary-50' : ''}`}>
                    <td className="table-cell font-medium">
                      {c.label}
                      {i === cyclesData.summary.currentIndex && (
                        <span className="badge badge-primary ml-2">Actual</span>
                      )}
                    </td>
                    <td className="table-cell text-dark-500">{formatDate(c.cutStart)} – {formatDate(c.cutEnd)}</td>
                    <td className="table-cell text-dark-500">{formatDate(c.dueDate)}</td>
                    <td className="table-cell text-right">{formatCurrency(c.openingBalance)}</td>
                    <td className="table-cell text-right text-danger-600 font-medium">{formatCurrency(c.interest)}</td>
                    <td className="table-cell text-right">{c.charges > 0 ? `+${formatCurrency(c.charges)}` : '—'}</td>
                    <td className="table-cell text-right text-success-600">{c.payments > 0 ? `−${formatCurrency(c.payments)}` : '—'}</td>
                    <td className="table-cell text-right font-bold">{formatCurrency(c.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">Registrar Pago</h3>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-5">
              <div>
                <label className="input-label">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="input-field pl-8 text-lg font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Fecha de Pago</label>
                <input
                  type="date"
                  required
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-success">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Charge Modal */}
      {showChargeModal && (
        <div className="modal-overlay" onClick={() => setShowChargeModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">Agregar Consumo</h3>
              <p className="text-sm text-dark-500 mt-1">Aumenta el saldo de la deuda por una nueva compra o cargo</p>
            </div>
            <form onSubmit={handleCharge} className="p-6 space-y-5">
              <div>
                <label className="input-label">Monto del consumo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={chargeData.amount}
                    onChange={(e) => setChargeData({ ...chargeData, amount: e.target.value })}
                    className="input-field pl-8 text-lg font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Descripción (opcional)</label>
                <input
                  type="text"
                  value={chargeData.description}
                  onChange={(e) => setChargeData({ ...chargeData, description: e.target.value })}
                  placeholder="Ej: Compra supermercado"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Fecha</label>
                <input
                  type="date"
                  required
                  value={chargeData.payment_date}
                  onChange={(e) => setChargeData({ ...chargeData, payment_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowChargeModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content animate-scale-in max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">Editar Deuda</h3>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="input-label">Nombre</label>
                  <input type="text" required value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="input-label">Banco o Prestamista</label>
                  <input type="text" required value={editData.bank_or_lender} onChange={(e) => setEditData({ ...editData, bank_or_lender: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Monto Total</label>
                  <input type="number" step="0.01" required value={editData.total_amount} onChange={(e) => setEditData({ ...editData, total_amount: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Pago Mensual</label>
                  <input type="number" step="0.01" required value={editData.monthly_payment} onChange={(e) => setEditData({ ...editData, monthly_payment: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Tasa de Interés (%)</label>
                  <input type="number" step="0.01" required value={editData.interest_rate} onChange={(e) => setEditData({ ...editData, interest_rate: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Tipo de Interés</label>
                  <select value={editData.interest_type} onChange={(e) => setEditData({ ...editData, interest_type: e.target.value })} className="input-field">
                    <option value="fixed">Fijo</option>
                    <option value="variable">Variable</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Plazo (meses)</label>
                  <input type="number" required value={editData.term_months} onChange={(e) => setEditData({ ...editData, term_months: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Meses Restantes</label>
                  <input type="number" required value={editData.remaining_months} onChange={(e) => setEditData({ ...editData, remaining_months: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Fecha Inicio</label>
                  <input type="date" required value={editData.start_date} onChange={(e) => setEditData({ ...editData, start_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Fecha Fin</label>
                  <input type="date" required value={editData.end_date} onChange={(e) => setEditData({ ...editData, end_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Día de pago (1-31)</label>
                  <input type="number" min="1" max="31" value={editData.payment_day} onChange={(e) => setEditData({ ...editData, payment_day: e.target.value })} placeholder="Ej: 20" className="input-field" />
                </div>
                <div>
                  <label className="input-label">Día de corte (1-31)</label>
                  <input type="number" min="1" max="31" value={editData.cut_day} onChange={(e) => setEditData({ ...editData, cut_day: e.target.value })} placeholder="Ej: 10" className="input-field" />
                </div>
                <div>
                  <label className="input-label">Estado</label>
                  <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })} className="input-field">
                    <option value="active">Activa</option>
                    <option value="paid">Pagada</option>
                    <option value="defaulted">En mora</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowEditPaymentModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">Editar Pago</h3>
            </div>
            <form onSubmit={handleUpdatePayment} className="p-6 space-y-5">
              <div>
                <label className="input-label">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPaymentData.amount}
                    onChange={(e) => setEditPaymentData({ ...editPaymentData, amount: e.target.value })}
                    className="input-field pl-8 text-lg font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Fecha de Pago</label>
                <input
                  type="date"
                  required
                  value={editPaymentData.payment_date}
                  onChange={(e) => setEditPaymentData({ ...editPaymentData, payment_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEditPaymentModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
