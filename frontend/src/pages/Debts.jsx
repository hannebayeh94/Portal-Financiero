import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'
import { PlusIcon, BanknotesIcon, PencilIcon, TrashIcon, CalculatorIcon } from '@heroicons/react/24/outline'

export default function Debts() {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDebt, setEditingDebt] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    total_amount: '',
    interest_rate: '',
    interest_type: 'fixed',
    monthly_payment: '',
    term_months: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    bank_or_lender: '',
    status: 'active',
  })

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    try {
      const res = await api.get('/debts')
      setDebts(res.data)
    } catch (error) {
      toast.error('Error al cargar deudas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingDebt) {
        await api.put(`/debts/${editingDebt.id}`, formData)
        toast.success('Deuda actualizada')
      } else {
        await api.post('/debts', formData)
        toast.success('Deuda creada')
      }
      setShowModal(false)
      setEditingDebt(null)
      resetForm()
      fetchDebts()
    } catch (error) {
      toast.error(editingDebt ? 'Error al actualizar deuda' : 'Error al crear deuda')
    }
  }

  const handleEdit = (e, debt) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingDebt(debt)
    setFormData({
      name: debt.name,
      total_amount: debt.total_amount,
      interest_rate: debt.interest_rate,
      interest_type: debt.interest_type,
      monthly_payment: debt.monthly_payment,
      term_months: debt.term_months,
      start_date: debt.start_date.split('T')[0],
      end_date: debt.end_date.split('T')[0],
      bank_or_lender: debt.bank_or_lender,
      status: debt.status,
    })
    setShowModal(true)
  }

  const handleDelete = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('¿Estás seguro de eliminar esta deuda?')) return
    try {
      await api.delete(`/debts/${id}`)
      toast.success('Deuda eliminada')
      fetchDebts()
    } catch (error) {
      toast.error('Error al eliminar deuda')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      total_amount: '',
      interest_rate: '',
      interest_type: 'fixed',
      monthly_payment: '',
      term_months: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      bank_or_lender: '',
      status: 'active',
    })
  }

  const activeDebts = debts.filter(d => d.status === 'active')
  const totalDebt = activeDebts.reduce((sum, d) => sum + parseFloat(d.current_balance), 0)
  const totalMonthlyPayment = activeDebts.reduce((sum, d) => sum + parseFloat(d.monthly_payment), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Deudas y Préstamos</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span className="text-dark-500">
              Total: <span className="font-semibold text-danger-600">{formatCurrency(totalDebt)}</span>
            </span>
            <span className="text-dark-500">
              Pago mensual: <span className="font-semibold">{formatCurrency(totalMonthlyPayment)}</span>
            </span>
            <span className="text-dark-500">
              Activas: <span className="font-semibold">{activeDebts.length}</span>
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/calculator" className="btn-secondary">
            <CalculatorIcon className="h-5 w-5 mr-2" />
            Calculadora
          </Link>
          <button
            onClick={() => {
              resetForm()
              setEditingDebt(null)
              setShowModal(true)
            }}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Deuda
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 rounded-full"></div>
          <div className="w-8 h-8 border-4 border-primary-600 rounded-full animate-spin border-t-transparent absolute"></div>
        </div>
      ) : debts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BanknotesIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-display font-bold text-dark-900 mb-2">No hay deudas registradas</h3>
          <p className="text-dark-500 mb-6">Registra tus deudas para hacer un seguimiento</p>
          <button
            onClick={() => {
              resetForm()
              setEditingDebt(null)
              setShowModal(true)
            }}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Agregar Primera Deuda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {debts.map((debt) => {
            const paidPercentage = ((parseFloat(debt.total_amount) - parseFloat(debt.current_balance)) / parseFloat(debt.total_amount)) * 100
            return (
              <Link
                key={debt.id}
                to={`/debts/${debt.id}`}
                className="card p-6 hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-bold text-dark-900 group-hover:text-primary-600 transition-colors">
                      {debt.name}
                    </h3>
                    <p className="text-sm text-dark-500">{debt.bank_or_lender}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleEdit(e, debt)}
                      className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, debt.id)}
                      className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <span className={`badge ${
                      debt.status === 'active' ? 'badge-success' :
                      debt.status === 'paid' ? 'badge-primary' : 'badge-danger'
                    }`}>
                      {debt.status === 'active' ? 'Activa' :
                       debt.status === 'paid' ? 'Pagada' : 'En mora'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark-500">Saldo actual</span>
                    <span className="text-lg font-bold text-dark-900">{formatCurrency(debt.current_balance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark-500">Pago mensual</span>
                    <span className="font-semibold text-primary-600">{formatCurrency(debt.monthly_payment)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark-500">Tasa de interés</span>
                    <span className="font-semibold">{debt.interest_rate}% anual</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark-500">Meses restantes</span>
                    <span className="font-semibold">{debt.remaining_months}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-dark-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-dark-500">Progreso de pago</span>
                    <span className="text-xs font-semibold text-dark-700">{Math.round(paidPercentage)}%</span>
                  </div>
                  <div className="w-full bg-dark-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${paidPercentage}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scale-in max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">
                {editingDebt ? 'Editar Deuda' : 'Nueva Deuda'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="input-label">Nombre de la Deuda</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Préstamo personal"
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="input-label">Banco o Prestamista</label>
                  <input
                    type="text"
                    required
                    value={formData.bank_or_lender}
                    onChange={(e) => setFormData({ ...formData, bank_or_lender: e.target.value })}
                    placeholder="Ej: Banco Nacional"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Monto Total</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      className="input-field pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Pago Mensual</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.monthly_payment}
                      onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                      className="input-field pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Tasa de Interés (%) Anual</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Tipo de Interés</label>
                  <select
                    value={formData.interest_type}
                    onChange={(e) => setFormData({ ...formData, interest_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="fixed">Fijo</option>
                    <option value="variable">Variable</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Plazo (meses)</label>
                  <input
                    type="number"
                    required
                    value={formData.term_months}
                    onChange={(e) => setFormData({ ...formData, term_months: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Fecha de Finalización</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingDebt ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
