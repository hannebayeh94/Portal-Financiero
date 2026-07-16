import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function SavingsDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [transactionData, setTransactionData] = useState({
    amount: '',
    type: 'deposit',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [editTransactionData, setEditTransactionData] = useState({
    amount: '',
    type: 'deposit',
    date: '',
    description: '',
  })
  const [editData, setEditData] = useState({
    name: '',
    bank: '',
    current_balance: '',
    goal_amount: '',
    interest_rate: '',
    type: 'standard',
    active: true,
  })

  useEffect(() => {
    fetchAccount()
  }, [id])

  const fetchAccount = async () => {
    try {
      const res = await api.get(`/savings/${id}`)
      setAccount(res.data)
    } catch (error) {
      toast.error('Error al cargar cuenta')
      navigate('/savings')
    } finally {
      setLoading(false)
    }
  }

  const handleTransaction = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/savings/${id}/transactions`, transactionData)
      toast.success('Transacción registrada')
      setShowTransactionModal(false)
      setTransactionData({
        amount: '',
        type: 'deposit',
        date: new Date().toISOString().split('T')[0],
        description: '',
      })
      fetchAccount()
    } catch (error) {
      toast.error('Error al registrar transacción')
    }
  }

  const handleEdit = () => {
    setEditData({
      name: account.name,
      bank: account.bank,
      current_balance: account.current_balance,
      goal_amount: account.goal_amount || '',
      interest_rate: account.interest_rate,
      type: account.type,
      active: account.active,
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/savings/${id}`, editData)
      toast.success('Cuenta actualizada')
      setShowEditModal(false)
      fetchAccount()
    } catch (error) {
      toast.error('Error al actualizar cuenta')
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta de ahorro?')) return
    try {
      await api.delete(`/savings/${id}`)
      toast.success('Cuenta eliminada')
      navigate('/savings')
    } catch (error) {
      toast.error('Error al eliminar cuenta')
    }
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    setEditTransactionData({
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date.split('T')[0],
      description: transaction.description || '',
    })
    setShowEditTransactionModal(true)
  }

  const handleUpdateTransaction = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/savings/${id}/transactions/${editingTransaction.id}`, editTransactionData)
      toast.success('Transacción actualizada')
      setShowEditTransactionModal(false)
      setEditingTransaction(null)
      fetchAccount()
    } catch (error) {
      toast.error('Error al actualizar transacción')
    }
  }

  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return
    try {
      await api.delete(`/savings/${id}/transactions/${transactionId}`)
      toast.success('Transacción eliminada')
      fetchAccount()
    } catch (error) {
      toast.error('Error al eliminar transacción')
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

  if (!account) return null

  const progress = account.goal_amount
    ? Math.min(100, (parseFloat(account.current_balance) / parseFloat(account.goal_amount)) * 100)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/savings')}
            className="p-2 hover:bg-dark-100 rounded-xl transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-dark-600" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900">{account.name}</h1>
            <p className="text-dark-500">{account.bank}</p>
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
          <button onClick={() => setShowTransactionModal(true)} className="btn-primary bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Transacción
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-dark-500 mb-1">Saldo Actual</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(account.current_balance)}</p>
        </div>
        {account.goal_amount && (
          <div className="card p-5">
            <p className="text-sm text-dark-500 mb-1">Meta</p>
            <p className="text-2xl font-bold text-dark-900">{formatCurrency(account.goal_amount)}</p>
          </div>
        )}
        <div className="card p-5">
          <p className="text-sm text-dark-500 mb-1">Tasa de Interés</p>
          <p className="text-2xl font-bold text-dark-900">{account.interest_rate}%</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-dark-500 mb-1">Tipo</p>
          <p className="text-2xl font-bold text-dark-900">
            {account.type === 'standard' ? 'Estándar' :
             account.type === 'goal' ? 'Meta' : 'Inversión'}
          </p>
        </div>
      </div>

      {/* Progress */}
      {progress !== null && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-dark-500">Progreso hacia la meta</span>
            <span className="text-sm font-bold text-dark-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-dark-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-dark-500">
            <span>Actual: {formatCurrency(account.current_balance)}</span>
            <span>Meta: {formatCurrency(account.goal_amount)}</span>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="card p-6">
        <h3 className="text-lg font-display font-bold text-dark-900 mb-4">Historial de Transacciones</h3>
        {account.transactions?.length > 0 ? (
          <div className="space-y-3">
            {account.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    transaction.type === 'deposit' ? 'bg-success-100' :
                    transaction.type === 'withdrawal' ? 'bg-danger-100' : 'bg-primary-100'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <ArrowUpIcon className="h-5 w-5 text-success-600" />
                    ) : transaction.type === 'withdrawal' ? (
                      <ArrowDownIcon className="h-5 w-5 text-danger-600" />
                    ) : (
                      <span className="text-primary-600 font-bold text-sm">%</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900">
                      {transaction.type === 'deposit' ? 'Depósito' :
                       transaction.type === 'withdrawal' ? 'Retiro' : 'Intereses'}
                    </p>
                    <p className="text-sm text-dark-500">{formatDate(transaction.date)}</p>
                    {transaction.description && (
                      <p className="text-xs text-dark-400 mt-1">{transaction.description}</p>
                    )}
                  </div>
                </div>
                <span className={`text-lg font-bold ${
                  transaction.type === 'deposit' ? 'text-success-600' :
                  transaction.type === 'withdrawal' ? 'text-danger-600' : 'text-primary-600'
                }`}>
                  {transaction.type === 'withdrawal' ? '-' : '+'}{formatCurrency(transaction.amount)}
                </span>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEditTransaction(transaction)}
                    className="p-1.5 hover:bg-dark-100 rounded-lg transition-colors"
                  >
                    <PencilIcon className="h-4 w-4 text-dark-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 text-danger-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-dark-500">No hay transacciones</p>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">Nueva Transacción</h3>
            </div>
            <form onSubmit={handleTransaction} className="p-6 space-y-5">
              <div>
                <label className="input-label">Tipo</label>
                <select
                  value={transactionData.type}
                  onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="deposit">Depósito</option>
                  <option value="withdrawal">Retiro</option>
                  <option value="interest">Intereses</option>
                </select>
              </div>
              <div>
                <label className="input-label">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={transactionData.amount}
                    onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                    className="input-field pl-8 text-lg font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Fecha</label>
                <input
                  type="date"
                  required
                  value={transactionData.date}
                  onChange={(e) => setTransactionData({ ...transactionData, date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Descripción (opcional)</label>
                <input
                  type="text"
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowTransactionModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">Editar Cuenta</h3>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div>
                <label className="input-label">Nombre</label>
                <input type="text" required value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Banco</label>
                <input type="text" required value={editData.bank} onChange={(e) => setEditData({ ...editData, bank: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Saldo Actual</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                  <input type="number" step="0.01" required value={editData.current_balance} onChange={(e) => setEditData({ ...editData, current_balance: e.target.value })} className="input-field pl-8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Meta (opcional)</label>
                  <input type="number" step="0.01" value={editData.goal_amount} onChange={(e) => setEditData({ ...editData, goal_amount: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Tasa de Interés (%)</label>
                  <input type="number" step="0.01" value={editData.interest_rate} onChange={(e) => setEditData({ ...editData, interest_rate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Tipo</label>
                  <select value={editData.type} onChange={(e) => setEditData({ ...editData, type: e.target.value })} className="input-field">
                    <option value="standard">Estándar</option>
                    <option value="goal">Meta</option>
                    <option value="investment">Inversión</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Estado</label>
                  <select value={editData.active} onChange={(e) => setEditData({ ...editData, active: e.target.value === 'true' })} className="input-field">
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
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

      {/* Edit Transaction Modal */}
      {showEditTransactionModal && (
        <div className="modal-overlay" onClick={() => setShowEditTransactionModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-xl font-display font-bold text-dark-900">Editar Transacción</h3>
            </div>
            <form onSubmit={handleUpdateTransaction} className="p-6 space-y-5">
              <div>
                <label className="input-label">Tipo</label>
                <select
                  value={editTransactionData.type}
                  onChange={(e) => setEditTransactionData({ ...editTransactionData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="deposit">Depósito</option>
                  <option value="withdrawal">Retiro</option>
                  <option value="interest">Intereses</option>
                </select>
              </div>
              <div>
                <label className="input-label">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editTransactionData.amount}
                    onChange={(e) => setEditTransactionData({ ...editTransactionData, amount: e.target.value })}
                    className="input-field pl-8 text-lg font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Fecha</label>
                <input
                  type="date"
                  required
                  value={editTransactionData.date}
                  onChange={(e) => setEditTransactionData({ ...editTransactionData, date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Descripción (opcional)</label>
                <input
                  type="text"
                  value={editTransactionData.description}
                  onChange={(e) => setEditTransactionData({ ...editTransactionData, description: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEditTransactionModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
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
