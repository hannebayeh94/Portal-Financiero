import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline'

const PALETTE = ['#F43F5E', '#F59E0B', '#6D54E8', '#0EA5E9', '#22C55E', '#A855F7', '#3B82F6', '#8A90A6', '#16A34A', '#9333EA']

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ name: '', type: 'expense', color: PALETTE[0] })

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data)
    } catch (error) {
      toast.error('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const resetForm = () => setFormData({ name: '', type: 'expense', color: PALETTE[0] })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, formData)
        toast.success('Categoría actualizada')
      } else {
        await api.post('/categories', formData)
        toast.success('Categoría creada')
      }
      setShowModal(false); setEditing(null); resetForm(); fetchCategories()
    } catch (error) {
      toast.error('Error al guardar categoría')
    }
  }

  const handleEdit = (cat) => {
    setEditing(cat)
    setFormData({ name: cat.name, type: cat.type, color: cat.color || PALETTE[0] })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta categoría? Los movimientos asociados quedarán sin categoría.')) return
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Categoría eliminada')
      fetchCategories()
    } catch (error) {
      toast.error('Error al eliminar categoría')
    }
  }

  const expense = categories.filter(c => c.type === 'expense')
  const income = categories.filter(c => c.type === 'income')

  const Group = ({ title, items, accent }) => (
    <div className="card p-6">
      <h3 className={`text-lg font-display font-bold mb-4 ${accent}`}>{title}</h3>
      {items.length === 0 ? (
        <p className="text-dark-400 text-sm">Sin categorías</p>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-50 transition-colors">
              <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <span className="flex-1 font-medium text-dark-800">{c.name}</span>
              <button onClick={() => handleEdit(c)} className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                <PencilIcon className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Categorías</h1>
          <p className="text-dark-500 mt-1">Organiza tus ingresos y egresos</p>
        </div>
        <button onClick={() => { resetForm(); setEditing(null); setShowModal(true) }} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Categoría
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Group title="Egresos" items={expense} accent="text-danger-600" />
          <Group title="Ingresos" items={income} accent="text-success-600" />
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100 flex items-center gap-3">
              <TagIcon className="h-6 w-6 text-primary-600" />
              <h3 className="text-xl font-display font-bold text-dark-900">
                {editing ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="input-label">Nombre</label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Alimentación" className="input-field" />
              </div>
              <div>
                <label className="input-label">Tipo</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input-field">
                  <option value="expense">Egreso</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
              <div>
                <label className="input-label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-8 h-8 rounded-full transition-all ${formData.color === c ? 'ring-2 ring-offset-2 ring-dark-400 scale-110' : ''}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
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
