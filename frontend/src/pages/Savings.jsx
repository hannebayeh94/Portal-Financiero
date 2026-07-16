import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'
import { PlusIcon, WalletIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function Savings() {
  const [savings, setSavings] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    current_balance: '',
    goal_amount: '',
    interest_rate: '',
    type: 'standard',
    start_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchSavings()
  }, [])

  const fetchSavings = async () => {
    try {
      const [savingsRes, summaryRes] = await Promise.all([
        api.get('/savings'),
        api.get('/savings/summary'),
      ])
      setSavings(savingsRes.data)
      setSummary(summaryRes.data)
    } catch (error) {
      toast.error('Error al cargar ahorros')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAccount) {
        await api.put(`/savings/${editingAccount.id}`, formData)
        toast.success('Cuenta actualizada')
      } else {
        await api.post('/savings', formData)
        toast.success('Cuenta de ahorro creada')
      }
      setShowModal(false)
      setEditingAccount(null)
      resetForm()
      fetchSavings()
    } catch (error) {
      toast.error(editingAccount ? 'Error al actualizar cuenta' : 'Error al crear cuenta')
    }
  }

  const handleEdit = (e, account) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingAccount(account)
    setFormData({
      name: account.name,
      bank: account.bank,
      current_balance: account.current_balance,
      goal_amount: account.goal_amount || '',
      interest_rate: account.interest_rate,
      type: account.type,
      start_date: account.start_date.split('T')[0],
    })
    setShowModal(true)
  }

  const handleDelete = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('¿Estás seguro de eliminar esta cuenta de ahorro?')) return
    try {
      await api.delete(`/savings/${id}`)
      toast.success('Cuenta eliminada')
      fetchSavings()
    } catch (error) {
      toast.error('Error al eliminar cuenta')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      bank: '',
      current_balance: '',
      goal_amount: '',
      interest_rate: '',
      type: 'standard',
      start_date: new Date().toISOString().split('T')[0],
    })
  }

  const totalBalance = summary?.total_balance || 0
  const totalAccounts = summary?.total_accounts || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Ahorros</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span className="text-dark-500">
              Total: <span className="font-semibold text-purple-600">{formatCurrency(totalBalance)}</span>
            </span>
            <span className="text-dark-500">
              Cuentas: <span className="font-semibold">{totalAccounts}</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingAccount(null)
            setShowModal(true)
          }}
          className="btn-primary bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Cuenta
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 rounded-full"></div>
          <div className="w-8 h-8 border-4 border-primary-600 rounded-full animate-spin border-t-transparent absolute"></div>
        </div>
      ) : savings.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <WalletIcon className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-display font-bold text-dark-900 mb-2">No hay cuentas de ahorro</h3>
          <p className="text-dark-500 mb-6">Crea tu primera cuenta para comenzar a ahorrar</p>
          <button
            onClick={() => {
              resetForm()
              setEditingAccount(null)
              setShowModal(true)
            }}
            className="btn-primary bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Primera Cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savings.map((account) => {
            const progress = account.goal_amount
              ? Math.min(100, (parseFloat(account.current_balance) / parseFloat(account.goal_amount)) * 100)
              : null
            return (
              <Link
                key={account.id}
                to={`/savings/${account.id}`}
                className="card p-6 hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-bold text-dark-900 group-hover:text-purple-600 transition-colors">
                      {account.name}
                    </h3>
                    <p className="text-sm text-dark-500">{account.bank}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleEdit(e, account)}
                      className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, account.id)}
                      className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <span className={`badge ${
                      account.type === 'standard' ? 'badge-dark' :
                      account.type === 'goal' ? 'badge-success' : 'badge-primary'
                    }`}>
                      {account.type === 'standard' ? 'Estándar' :
                       account.type === 'goal' ? 'Meta' : 'Inversión'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark-500">Saldo actual</span>
                    <span className="text-lg font-bold text-purple-600">{formatCurrency(account.current_balance)}</span>
                  </div>
                  {account.goal_amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-500">Meta</span>
                      <span className="font-semibold">{formatCurrency(account.goal_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark-500">Tasa de interés</span>
                    <span className="font-semibold">{account.interest_rate}%</span>
                  </div>
                </div>

                {progress !== null && (
                  <div className="pt-4 border-t border-dark-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-dark-500">Progreso de meta</span>
                      <span className="text-xs font-semibold text-dark-700">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-dark-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">
                {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta de Ahorro'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="input-label">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Ahorro vacaciones"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Banco</label>
                <input
                  type="text"
                  required
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">{editingAccount ? 'Saldo Actual' : 'Saldo Inicial'}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.current_balance}
                      onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                      className="input-field pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Meta (opcional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.goal_amount}
                      onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                      className="input-field pl-8"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Tasa de Interés (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
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
                    <option value="standard">Estándar</option>
                    <option value="goal">Meta</option>
                    <option value="investment">Inversión</option>
                  </select>
                </div>
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
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                  {editingAccount ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
