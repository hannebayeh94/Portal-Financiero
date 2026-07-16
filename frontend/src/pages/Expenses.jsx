import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'variable',
    recurring: false,
    recurrence_type: 'monthly',
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses')
      setExpenses(res.data)
    } catch (error) {
      toast.error('Error al cargar egresos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, formData)
        toast.success('Egreso actualizado')
      } else {
        await api.post('/expenses', formData)
        toast.success('Egreso creado')
      }
      setShowModal(false)
      setEditingExpense(null)
      resetForm()
      fetchExpenses()
    } catch (error) {
      toast.error('Error al guardar egreso')
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      amount: expense.amount,
      description: expense.description,
      date: expense.date.split('T')[0],
      type: expense.type,
      recurring: expense.recurring,
      recurrence_type: expense.recurrence_type || 'monthly',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este egreso?')) return
    try {
      await api.delete(`/expenses/${id}`)
      toast.success('Egreso eliminado')
      fetchExpenses()
    } catch (error) {
      toast.error('Error al eliminar egreso')
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'variable',
      recurring: false,
      recurrence_type: 'monthly',
    })
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
  const fixedExpenses = expenses.filter(e => e.type === 'fixed').reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
  const variableExpenses = expenses.filter(e => e.type === 'variable').reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Egresos</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span className="text-dark-500">
              Total: <span className="font-semibold text-danger-600">{formatCurrency(totalExpenses)}</span>
            </span>
            <span className="text-dark-500">
              Fijos: <span className="font-semibold">{formatCurrency(fixedExpenses)}</span>
            </span>
            <span className="text-dark-500">
              Variables: <span className="font-semibold">{formatCurrency(variableExpenses)}</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingExpense(null)
            setShowModal(true)
          }}
          className="btn-danger"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Egreso
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 rounded-full"></div>
          <div className="w-8 h-8 border-4 border-primary-600 rounded-full animate-spin border-t-transparent absolute"></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-danger-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowTrendingDownIcon className="h-8 w-8 text-danger-600" />
          </div>
          <h3 className="text-lg font-display font-bold text-dark-900 mb-2">No hay egresos</h3>
          <p className="text-dark-500 mb-6">Comienza registrando tus egresos</p>
          <button
            onClick={() => {
              resetForm()
              setEditingExpense(null)
              setShowModal(true)
            }}
            className="btn-danger"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Agregar Primer Egreso
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50">
                <tr>
                  <th className="table-header">Fecha</th>
                  <th className="table-header">Descripción</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Monto</th>
                  <th className="table-header">Recurrente</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-dark-50 transition-colors">
                    <td className="table-cell">{formatDate(expense.date)}</td>
                    <td className="table-cell font-medium">{expense.description}</td>
                    <td className="table-cell">
                      <span className={`badge ${expense.type === 'fixed' ? 'badge-primary' : 'badge-warning'}`}>
                        {expense.type === 'fixed' ? 'Fijo' : 'Variable'}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-danger-600">{formatCurrency(expense.amount)}</td>
                    <td className="table-cell">
                      {expense.recurring ? (
                        <span className="badge badge-success">Sí</span>
                      ) : (
                        <span className="badge badge-dark">No</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">
                {editingExpense ? 'Editar Egreso' : 'Nuevo Egreso'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="input-label">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="input-field pl-8 text-lg font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Descripción</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Arriendo"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Fecha</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="fixed">Fijo</option>
                  <option value="variable">Variable</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-dark-50 rounded-xl">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-dark-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-dark-700">
                  Egreso recurrente
                </label>
              </div>
              {formData.recurring && (
                <div>
                  <label className="input-label">Frecuencia</label>
                  <select
                    value={formData.recurrence_type}
                    onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-danger">
                  {editingExpense ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
