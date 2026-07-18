import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import ClayToggle from '../components/ClayToggle'

const sources = [
  { value: 'salary', label: 'Salario' },
  { value: 'business', label: 'Negocio' },
  { value: 'investment', label: 'Inversión' },
  { value: 'other', label: 'Otro' },
]

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export default function Incomes() {
  const now = new Date()
  const [incomes, setIncomes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: now.toISOString().split('T')[0],
    category_id: '',
    source: 'salary',
    recurring: false,
    recurrence_type: 'monthly',
  })
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const fetchIncomes = async () => {
    try {
      const res = await api.get('/incomes', { params: { month: selectedMonth, year: selectedYear } })
      setIncomes(res.data)
    } catch (error) {
      toast.error('Error al cargar ingresos')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories', { params: { type: 'income' } })
      setCategories(res.data)
    } catch (error) { /* silencioso */ }
  }

  useEffect(() => {
    fetchIncomes()
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...formData, category_id: formData.category_id || null }
    try {
      if (editingIncome) {
        await api.put(`/incomes/${editingIncome.id}`, payload)
        toast.success('Ingreso actualizado')
      } else {
        await api.post('/incomes', payload)
        toast.success('Ingreso creado')
      }
      setShowModal(false)
      setEditingIncome(null)
      resetForm()
      fetchIncomes()
    } catch (error) {
      toast.error('Error al guardar ingreso')
    }
  }

  const handleEdit = (income) => {
    setEditingIncome(income)
    setFormData({
      amount: income.amount,
      description: income.description,
      date: income.date.split('T')[0],
      category_id: income.category_id || '',
      source: income.source,
      recurring: income.recurring,
      recurrence_type: income.recurrence_type || 'monthly',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return
    try {
      await api.delete(`/incomes/${id}`)
      toast.success('Ingreso eliminado')
      fetchIncomes()
    } catch (error) {
      toast.error('Error al eliminar ingreso')
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category_id: '',
      source: 'salary',
      recurring: false,
      recurrence_type: 'monthly',
    })
  }

  const totalIncome = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Ingresos</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input-field !w-auto !py-1 !text-sm font-semibold"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field !w-auto !py-1 !text-sm font-semibold"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <p className="text-dark-500 mt-1">
            Total: <span className="font-semibold text-success-600">{formatCurrency(totalIncome)}</span>
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingIncome(null)
            setShowModal(true)
          }}
          className="btn-success"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Ingreso
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 rounded-full"></div>
          <div className="w-8 h-8 border-4 border-primary-600 rounded-full animate-spin border-t-transparent absolute"></div>
        </div>
      ) : incomes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowTrendingUpIcon className="h-8 w-8 text-success-600" />
          </div>
          <h3 className="text-lg font-display font-bold text-dark-900 mb-2">No hay ingresos</h3>
          <p className="text-dark-500 mb-6">Comienza registrando tus primeros ingresos</p>
          <button
            onClick={() => {
              resetForm()
              setEditingIncome(null)
              setShowModal(true)
            }}
            className="btn-success"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Agregar Primer Ingreso
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
                  <th className="table-header">Fuente</th>
                  <th className="table-header">Monto</th>
                  <th className="table-header">Recurrente</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-dark-50 transition-colors">
                    <td className="table-cell">{formatDate(income.date)}</td>
                    <td className="table-cell font-medium">{income.description}</td>
                    <td className="table-cell">
                      <span className="badge badge-primary">
                        {sources.find(s => s.value === income.source)?.label || income.source}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-success-600">{formatCurrency(income.amount)}</td>
                    <td className="table-cell">
                      {income.recurring ? (
                        <span className="badge badge-success">Sí</span>
                      ) : (
                        <span className="badge badge-dark">No</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(income)}
                          className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
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
                {editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}
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
                  placeholder="Ej: Salario mensual"
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
                <label className="input-label">Fuente</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="input-field"
                >
                  {sources.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Categoría</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center p-4 bg-[#e8ddd0] rounded-xl shadow-clay-inset">
                <ClayToggle
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(val) => setFormData({ ...formData, recurring: val })}
                  label="Ingreso recurrente"
                />
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
                <button type="submit" className="btn-success">
                  {editingIncome ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
