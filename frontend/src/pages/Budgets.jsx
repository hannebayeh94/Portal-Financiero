import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, ChartPieIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Budgets() {
  const now = new Date()
  const [data, setData] = useState({ budgets: [] })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [formData, setFormData] = useState({ category_id: '', amount: '' })

  const fetchBudgets = async () => {
    try {
      const res = await api.get('/budgets', { params: { month: selectedMonth, year: selectedYear } })
      setData(res.data)
    } catch (error) {
      toast.error('Error al cargar presupuestos')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories', { params: { type: 'expense' } })
      setCategories(res.data)
    } catch (error) { /* silencioso */ }
  }

  useEffect(() => { fetchBudgets() }, [selectedMonth, selectedYear])
  useEffect(() => { fetchCategories() }, [])

  const resetForm = () => setFormData({ category_id: '', amount: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/budgets/${editing.id}`, { amount: formData.amount })
        toast.success('Presupuesto actualizado')
      } else {
        await api.post('/budgets', {
          category_id: formData.category_id,
          amount: formData.amount,
          month: selectedMonth,
          year: selectedYear,
        })
        toast.success('Presupuesto creado')
      }
      setShowModal(false); setEditing(null); resetForm(); fetchBudgets()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar presupuesto')
    }
  }

  const handleEdit = (b) => {
    setEditing(b)
    setFormData({ category_id: String(b.category_id), amount: b.amount })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este presupuesto?')) return
    try {
      await api.delete(`/budgets/${id}`)
      toast.success('Presupuesto eliminado')
      fetchBudgets()
    } catch (error) {
      toast.error('Error al eliminar presupuesto')
    }
  }

  const budgets = data.budgets || []
  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0)
  const totalSpent = budgets.reduce((s, b) => s + parseFloat(b.spent || 0), 0)
  // categorías sin presupuesto aún, para el selector de creación
  const usedIds = new Set(budgets.map(b => b.category_id))
  const availableCategories = categories.filter(c => !usedIds.has(c.id))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Presupuestos</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input-field !w-auto !py-1 !text-sm font-semibold">
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field !w-auto !py-1 !text-sm font-semibold">
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <p className="text-dark-500 mt-1 text-sm">
            Presupuestado: <span className="font-semibold text-primary-600">{formatCurrency(totalBudget)}</span>
            {'  ·  '}Gastado: <span className="font-semibold text-danger-600">{formatCurrency(totalSpent)}</span>
          </p>
        </div>
        <button onClick={() => { resetForm(); setEditing(null); setShowModal(true) }} className="btn-primary" disabled={availableCategories.length === 0}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Presupuesto
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : budgets.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChartPieIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-display font-bold text-dark-900 mb-2">Sin presupuestos este mes</h3>
          <p className="text-dark-500 mb-6">Define límites de gasto por categoría y controla tu mes.</p>
          <button onClick={() => { resetForm(); setEditing(null); setShowModal(true) }} className="btn-primary" disabled={availableCategories.length === 0}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Primer Presupuesto
          </button>
          {categories.length === 0 && (
            <p className="text-xs text-dark-400 mt-4">Primero crea categorías de egreso en la sección Categorías.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const pct = Math.min(100, b.pct)
            const barColor = b.over_budget ? 'bg-danger-500' : b.pct >= 80 ? 'bg-warning-500' : 'bg-success-500'
            return (
              <div key={b.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: b.category_color || '#8A90A6' }} />
                    <span className="font-display font-bold text-dark-900">{b.category_name || 'Sin categoría'}</span>
                    {b.over_budget && (
                      <span className="badge badge-danger flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-3 w-3" /> Sobregiro
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(b)} className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-dark-500">{formatCurrency(b.spent)} de {formatCurrency(b.amount)}</span>
                  <span className={`font-semibold ${b.over_budget ? 'text-danger-600' : 'text-dark-700'}`}>{b.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-dark-100 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className={`text-xs mt-2 ${b.remaining < 0 ? 'text-danger-600 font-semibold' : 'text-dark-400'}`}>
                  {b.remaining >= 0 ? `Disponible: ${formatCurrency(b.remaining)}` : `Excedido: ${formatCurrency(Math.abs(b.remaining))}`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100 flex items-center gap-3">
              <ChartPieIcon className="h-6 w-6 text-primary-600" />
              <h3 className="text-xl font-display font-bold text-dark-900">
                {editing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="input-label">Categoría</label>
                <select value={formData.category_id} required disabled={!!editing}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="input-field">
                  <option value="">Selecciona…</option>
                  {(editing ? categories : availableCategories).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Monto mensual</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                  <input type="number" step="0.01" required value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00" className="input-field pl-8 text-lg font-semibold" />
                </div>
              </div>
              <p className="text-xs text-dark-400">Periodo: {MONTHS[selectedMonth - 1]} {selectedYear}</p>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">{editing ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
