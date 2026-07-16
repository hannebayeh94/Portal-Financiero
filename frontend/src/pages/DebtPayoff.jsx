import { useState, useMemo, useRef } from 'react'
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
import { Line } from 'react-chartjs-2'
import api from '../services/api'
import { formatCurrency, getMonthName } from '../utils/formatters'
import { saveScenario, listScenarios, deleteScenario, exportScenario, importScenario } from '../utils/scenarios'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  CloudArrowDownIcon,
  DocumentTextIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

let debtIdCounter = 1

function createDebt(name = '', initialBalance = '', monthlyRate = '', monthlyPayment = '') {
  return {
    id: ++debtIdCounter,
    name,
    initialBalance,
    monthlyRate,
    monthlyPayment,
    extraPayments: [],
    balanceIncrements: [],
  }
}

function computeProjection(debt) {
  const balance = parseFloat(debt.initialBalance) || 0
  const rate = (parseFloat(debt.monthlyRate) || 0) / 100
  const payment = parseFloat(debt.monthlyPayment) || 0

  if (!balance || !payment) return null

  const rows = []
  let currentBalance = balance
  let month = 1
  const startDate = new Date()
  startDate.setDate(1)

  while (currentBalance > 0.01 && month <= 600) {
    const extraPaymentsThisMonth = debt.extraPayments
      .filter(ep => ep.month === month)
      .reduce((sum, ep) => sum + (parseFloat(ep.amount) || 0), 0)

    const incrementsThisMonth = debt.balanceIncrements
      .filter(bi => bi.month === month)
      .reduce((sum, bi) => sum + (parseFloat(bi.amount) || 0), 0)

    const interest = currentBalance * rate
    const totalPayment = payment + extraPaymentsThisMonth
    const capital = totalPayment - interest
    const newBalance = Math.max(0, currentBalance - capital + incrementsThisMonth)

    const date = new Date(startDate)
    date.setMonth(date.getMonth() + month - 1)
    const monthName = MONTHS[date.getMonth()]
    const year = date.getFullYear()

    rows.push({
      month,
      monthName,
      year,
      label: `${monthName} ${year}`,
      initialBalance: Math.round(currentBalance * 100) / 100,
      interest: Math.max(0, Math.round(interest * 100) / 100),
      capital: Math.min(Math.round(capital * 100) / 100, currentBalance + interest),
      extraPayment: extraPaymentsThisMonth,
      increment: incrementsThisMonth,
      totalPayment: Math.round(totalPayment * 100) / 100,
      finalBalance: Math.round(newBalance * 100) / 100,
    })

    currentBalance = newBalance
    month++
  }

  const totalInterest = rows.reduce((sum, r) => sum + r.interest, 0)
  const totalPaid = rows.reduce((sum, r) => sum + r.totalPayment, 0)
  const totalCapital = balance

  return {
    rows,
    summary: {
      totalMonths: rows.length,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalCapital,
    },
  }
}

export default function DebtPayoff() {
  const [debts, setDebts] = useState([createDebt()])
  const [activeDebtIndex, setActiveDebtIndex] = useState(0)
  const [newExtraPayment, setNewExtraPayment] = useState({ month: '', amount: '' })
  const [newIncrement, setNewIncrement] = useState({ month: '', amount: '' })
  const [loadingExisting, setLoadingExisting] = useState(false)

  const activeDebt = debts[activeDebtIndex]
  const projection = useMemo(() => {
    if (!activeDebt) return null
    return computeProjection(activeDebt)
  }, [activeDebt])

  const updateDebt = (index, field, value) => {
    setDebts(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addDebt = () => {
    setDebts(prev => [...prev, createDebt()])
    setActiveDebtIndex(debts.length)
  }

  const removeDebt = (index) => {
    if (debts.length <= 1) return
    setDebts(prev => prev.filter((_, i) => i !== index))
    if (activeDebtIndex >= index && activeDebtIndex > 0) {
      setActiveDebtIndex(prev => prev - 1)
    }
  }

  const addExtraPayment = () => {
    if (!newExtraPayment.month || !newExtraPayment.amount) return
    setDebts(prev => {
      const next = [...prev]
      next[activeDebtIndex] = {
        ...next[activeDebtIndex],
        extraPayments: [
          ...next[activeDebtIndex].extraPayments,
          { month: parseInt(newExtraPayment.month), amount: parseFloat(newExtraPayment.amount), id: Date.now() },
        ],
      }
      return next
    })
    setNewExtraPayment({ month: '', amount: '' })
  }

  const removeExtraPayment = (id) => {
    setDebts(prev => {
      const next = [...prev]
      next[activeDebtIndex] = {
        ...next[activeDebtIndex],
        extraPayments: next[activeDebtIndex].extraPayments.filter(ep => ep.id !== id),
      }
      return next
    })
  }

  const addIncrement = () => {
    if (!newIncrement.month || !newIncrement.amount) return
    setDebts(prev => {
      const next = [...prev]
      next[activeDebtIndex] = {
        ...next[activeDebtIndex],
        balanceIncrements: [
          ...next[activeDebtIndex].balanceIncrements,
          { month: parseInt(newIncrement.month), amount: parseFloat(newIncrement.amount), id: Date.now() },
        ],
      }
      return next
    })
    setNewIncrement({ month: '', amount: '' })
  }

  const removeIncrement = (id) => {
    setDebts(prev => {
      const next = [...prev]
      next[activeDebtIndex] = {
        ...next[activeDebtIndex],
        balanceIncrements: next[activeDebtIndex].balanceIncrements.filter(bi => bi.id !== id),
      }
      return next
    })
  }

  const resetAll = () => {
    setDebts([createDebt()])
    setActiveDebtIndex(0)
  }

  const loadFromExisting = async () => {
    setLoadingExisting(true)
    try {
      const res = await api.get('/debts')
      const activeDebts = res.data.filter(d => d.status === 'active' && d.current_balance > 0)
      if (activeDebts.length === 0) {
        toast.error('No hay deudas activas para importar')
        return
      }
      const mapped = activeDebts.map(d => ({
        id: ++debtIdCounter,
        name: d.name,
        initialBalance: String(d.current_balance),
        monthlyRate: String((parseFloat(d.interest_rate) / 12).toFixed(2)),
        monthlyPayment: String(d.monthly_payment),
        extraPayments: [],
        balanceIncrements: [],
      }))
      if (debts.length === 1 && !debts[0].name && !debts[0].initialBalance) {
        setDebts(mapped)
      } else {
        setDebts(prev => [...prev, ...mapped])
      }
      setActiveDebtIndex(0)
      toast.success(`${mapped.length} deuda(s) importada(s) correctamente`)
    } catch (error) {
      toast.error('Error al cargar deudas existentes')
    } finally {
      setLoadingExisting(false)
    }
  }

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveStatus, setSaveStatus] = useState('draft')
  const [savedList, setSavedList] = useState([])
  const fileInputRef = useRef(null)

  const getSnapshot = () => ({
    debts: debts.map(d => ({
      ...d,
      extraPayments: d.extraPayments.map(ep => ({ ...ep })),
      balanceIncrements: d.balanceIncrements.map(bi => ({ ...bi })),
    })),
    activeDebtIndex,
  })

  const restoreSnapshot = (snapshot) => {
    debtIdCounter = snapshot.debts.reduce((max, d) => Math.max(max, d.id), 0)
    setDebts(snapshot.debts)
    setActiveDebtIndex(snapshot.activeDebtIndex)
    setNewExtraPayment({ month: '', amount: '' })
    setNewIncrement({ month: '', amount: '' })
  }

  const handleSave = () => {
    if (!saveName.trim()) { toast.error('Ingresa un nombre para el escenario'); return }
    try {
      saveScenario('debt-payoff', getSnapshot(), saveName.trim(), saveStatus)
      toast.success(`Escenario "${saveName}" guardado`)
      setShowSaveModal(false)
      setSaveName('')
    } catch (error) {
      toast.error('Error al guardar: ' + error.message)
    }
  }

  const openLoadModal = () => {
    setSavedList(listScenarios('debt-payoff'))
    setShowLoadModal(true)
  }

  const handleLoad = (scenario) => {
    restoreSnapshot(scenario.data)
    setShowLoadModal(false)
    toast.success(`Escenario "${scenario.name}" cargado`)
  }

  const handleDeleteScenario = (id, name) => {
    deleteScenario(id)
    setSavedList(prev => prev.filter(s => s.id !== id))
    toast.success(`Escenario "${name}" eliminado`)
  }

  const handleExport = (id) => {
    exportScenario(id)
    toast.success('Archivo descargado')
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = await importScenario(file)
      setSavedList(listScenarios('debt-payoff'))
      toast.success(`Escenario "${data.name}" importado`)
    } catch (error) {
      toast.error(error.message || 'Error al importar')
    }
    e.target.value = ''
  }

  const rows = projection?.rows || []
  const summary = projection?.summary

  const lineChartData = {
    labels: rows.filter((_, i) => i % 2 === 0 || i === rows.length - 1).map(r => r.label),
    datasets: [
      {
        label: 'Saldo Pendiente',
        data: rows.filter((_, i) => i % 2 === 0 || i === rows.length - 1).map(r => r.finalBalance),
        borderColor: '#d4a574',
        backgroundColor: 'rgba(212, 165, 116, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#d4a574',
        pointBorderColor: '#f5ebe0',
        pointBorderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#f5ebe0',
        titleColor: '#2d3436',
        bodyColor: '#2d3436',
        borderColor: '#d4c4b4',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (ctx) => `Saldo: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8a7a6a', font: { size: 10, family: 'Inter' }, maxRotation: 45 },
      },
      y: {
        grid: { color: 'rgba(212, 196, 180, 0.3)' },
        ticks: {
          color: '#8a7a6a',
          font: { size: 11, family: 'Inter' },
          callback: (value) => '$' + value.toLocaleString('es-CO'),
        },
      },
    },
  }

  return (
    <div className="space-y-6" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--clay-text)' }}>
            Calculadora de Pago de Deudas
          </h1>
          <p className="mt-1" style={{ color: 'var(--clay-text-muted)' }}>
            Proyecta el tiempo para liquidar tus deudas considerando intereses, pagos extras y nuevos cargos
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={openLoadModal} className="clay-btn px-3 py-2.5 text-sm inline-flex items-center gap-1.5">
            <FolderOpenIcon className="h-4 w-4" />
            Cargar
          </button>
          <button onClick={() => { setSaveName(''); setSaveStatus('draft'); setShowSaveModal(true) }} className="clay-btn-primary px-3 py-2.5 text-sm inline-flex items-center gap-1.5">
            <DocumentTextIcon className="h-4 w-4" />
            Guardar
          </button>
          <button onClick={resetAll} className="clay-btn px-3 py-2.5 text-sm inline-flex items-center gap-1.5">
            <ArrowPathIcon className="h-4 w-4" />
            Reiniciar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Sidebar - Debt List */}
        <div className="xl:col-span-1 space-y-4">
          <div className="clay-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Deudas</h3>
              <button onClick={addDebt} className="clay-btn w-8 h-8 flex items-center justify-center">
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={loadFromExisting}
              disabled={loadingExisting}
              className="clay-btn w-full text-xs px-3 py-2 mb-3 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loadingExisting ? (
                <span className="w-3.5 h-3.5 border-2 border-clay-text border-t-transparent rounded-full animate-spin" />
              ) : (
                <CloudArrowDownIcon className="h-3.5 w-3.5" />
              )}
              {loadingExisting ? 'Cargando...' : 'Cargar deudas existentes'}
            </button>
            <div className="space-y-2">
              {debts.map((debt, index) => (
                <button
                  key={debt.id}
                  onClick={() => setActiveDebtIndex(index)}
                  className={`w-full text-left px-4 py-3  transition-all duration-200 ${
                    activeDebtIndex === index
                      ? 'clay-btn-primary text-sm'
                      : 'clay-btn text-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{debt.name || `Deuda ${index + 1}`}</span>
                    {debts.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeDebt(index) }}
                        className="ml-2 p-1 rounded-lg hover:bg-black/10 transition-colors"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {summary && (
            <div className="clay-card p-5 space-y-4">
              <h3 className="font-display font-bold text-sm" style={{ color: 'var(--clay-text)' }}>Resumen</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Tiempo estimado</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--clay-text)' }}>
                    {summary.totalMonths} meses
                    <span className="text-sm font-normal" style={{ color: 'var(--clay-text-muted)' }}>
                      {' '}({Math.floor(summary.totalMonths / 12)}a {summary.totalMonths % 12}m)
                    </span>
                  </p>
                </div>
                <div className="clay-divider" />
                <div>
                  <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Total a pagar</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--clay-text)' }}>{formatCurrency(summary.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Total intereses</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--clay-red)' }}>{formatCurrency(summary.totalInterest)}</p>
                </div>
                {summary.totalPaid > 0 && (
                  <div className="clay-progress">
                    <div
                      className="clay-progress-bar"
                      style={{ width: `${Math.min(100, (summary.totalCapital / summary.totalPaid) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Area */}
        <div className="xl:col-span-4 space-y-6">
          {/* Debt Form */}
          <div className="clay-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #d4a574, #c49464)', boxShadow: 'var(--clay-shadow-sm)' }}>
                <BanknotesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg" style={{ color: 'var(--clay-text)' }}>
                  {activeDebt?.name || 'Nueva Deuda'}
                </h3>
                <p className="text-sm" style={{ color: 'var(--clay-text-muted)' }}>Datos principales</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--clay-text-muted)' }}>Nombre de la deuda</label>
                <input
                  type="text"
                  value={activeDebt?.name || ''}
                  onChange={(e) => updateDebt(activeDebtIndex, 'name', e.target.value)}
                  placeholder="Ej: Tarjeta Rappi"
                  className="clay-input w-full px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--clay-text-muted)' }}>Saldo inicial</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--clay-text-muted)' }}>$</span>
                  <input
                    type="number"
                    step="1"
                    value={activeDebt?.initialBalance || ''}
                    onChange={(e) => updateDebt(activeDebtIndex, 'initialBalance', e.target.value)}
                    placeholder="8,700,000"
                    className="clay-input w-full px-4 py-3 pl-8 text-sm font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--clay-text-muted)' }}>Tasa mensual (MV)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={activeDebt?.monthlyRate || ''}
                    onChange={(e) => updateDebt(activeDebtIndex, 'monthlyRate', e.target.value)}
                    placeholder="1.84"
                    className="clay-input w-full px-4 py-3 pr-8 text-sm font-semibold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--clay-text-muted)' }}>%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--clay-text-muted)' }}>Pago mensual</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--clay-text-muted)' }}>$</span>
                  <input
                    type="number"
                    step="1"
                    value={activeDebt?.monthlyPayment || ''}
                    onChange={(e) => updateDebt(activeDebtIndex, 'monthlyPayment', e.target.value)}
                    placeholder="1,900,000"
                    className="clay-input w-full px-4 py-3 pl-8 text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Extra Payments & Increments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Extra Payments */}
            <div className="clay-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CurrencyDollarIcon className="h-5 w-5" style={{ color: 'var(--clay-green)' }} />
                <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Pagos adicionales</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  placeholder="Mes"
                  value={newExtraPayment.month}
                  onChange={(e) => setNewExtraPayment(prev => ({ ...prev, month: e.target.value }))}
                  className="clay-input w-20 px-3 py-2 text-sm text-center"
                />
                <input
                  type="number"
                  placeholder="Monto"
                  value={newExtraPayment.amount}
                  onChange={(e) => setNewExtraPayment(prev => ({ ...prev, amount: e.target.value }))}
                  className="clay-input flex-1 px-3 py-2 text-sm"
                />
                <button onClick={addExtraPayment} className="clay-btn-success px-3 py-2 text-sm">
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {activeDebt?.extraPayments?.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Sin pagos adicionales</p>
                )}
                {activeDebt?.extraPayments?.map((ep) => (
                  <div key={ep.id} className="flex items-center justify-between px-3 py-2 " style={{ background: 'rgba(125, 171, 125, 0.1)' }}>
                    <span className="text-sm" style={{ color: 'var(--clay-text)' }}>
                      Mes {ep.month}: <strong>{formatCurrency(ep.amount)}</strong>
                    </span>
                    <button onClick={() => removeExtraPayment(ep.id)} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
                      <TrashIcon className="h-3.5 w-3.5" style={{ color: 'var(--clay-red)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance Increments */}
            <div className="clay-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5" style={{ color: 'var(--clay-red)' }} />
                <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Incrementos al saldo</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  placeholder="Mes"
                  value={newIncrement.month}
                  onChange={(e) => setNewIncrement(prev => ({ ...prev, month: e.target.value }))}
                  className="clay-input w-20 px-3 py-2 text-sm text-center"
                />
                <input
                  type="number"
                  placeholder="Monto"
                  value={newIncrement.amount}
                  onChange={(e) => setNewIncrement(prev => ({ ...prev, amount: e.target.value }))}
                  className="clay-input flex-1 px-3 py-2 text-sm"
                />
                <button onClick={addIncrement} className="clay-btn-danger px-3 py-2 text-sm">
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {activeDebt?.balanceIncrements?.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Sin incrementos</p>
                )}
                {activeDebt?.balanceIncrements?.map((bi) => (
                  <div key={bi.id} className="flex items-center justify-between px-3 py-2 " style={{ background: 'rgba(196, 122, 122, 0.1)' }}>
                    <span className="text-sm" style={{ color: 'var(--clay-text)' }}>
                      Mes {bi.month}: <strong>{formatCurrency(bi.amount)}</strong>
                    </span>
                    <button onClick={() => removeIncrement(bi.id)} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
                      <TrashIcon className="h-3.5 w-3.5" style={{ color: 'var(--clay-red)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          {rows.length > 0 && (
            <div className="clay-card p-6">
              <h3 className="font-display font-bold mb-4" style={{ color: 'var(--clay-text)' }}>Evolución del saldo pendiente</h3>
              <div className="h-72">
                <Line data={lineChartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Empty State */}
          {rows.length === 0 && (
            <div className="clay-card p-12 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: '#e8ddd0', boxShadow: 'var(--clay-shadow-inset)' }}>
                <BanknotesIcon className="h-10 w-10" style={{ color: 'var(--clay-text-muted)' }} />
              </div>
              <h3 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--clay-text)' }}>Calcula tu plan de pago</h3>
              <p className="max-w-md mx-auto" style={{ color: 'var(--clay-text-muted)' }}>
                Ingresa los datos de tu deuda en el formulario superior para ver la proyección mes a mes
              </p>
            </div>
          )}

          {/* Projection Table */}
          {rows.length > 0 && (
            <div className="clay-card overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Proyección mes a mes</h3>
                <span className="clay-badge">
                  {summary.totalMonths} meses • {formatCurrency(summary.totalPaid)}
                </span>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="clay-table w-full">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Mes</th>
                      <th>Saldo inicial</th>
                      <th>Intereses</th>
                      <th>Abono a capital</th>
                      <th>Pago extra</th>
                      <th>Incremento</th>
                      <th>Pago total</th>
                      <th>Saldo final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.month}>
                        <td className="font-semibold">
                          <span className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>{row.monthName.slice(0, 3)}</span>
                          <br />
                          <span style={{ color: 'var(--clay-text)' }}>{row.month}</span>
                        </td>
                        <td style={{ color: 'var(--clay-text)' }}>{formatCurrency(row.initialBalance)}</td>
                        <td style={{ color: 'var(--clay-red)' }}>{formatCurrency(row.interest)}</td>
                        <td style={{ color: 'var(--clay-green)' }}>{formatCurrency(Math.max(0, row.capital - row.interest))}</td>
                        <td style={{ color: 'var(--clay-accent)' }}>
                          {row.extraPayment > 0 ? formatCurrency(row.extraPayment) : '-'}
                        </td>
                        <td style={{ color: 'var(--clay-red)' }}>
                          {row.increment > 0 ? formatCurrency(row.increment) : '-'}
                        </td>
                        <td className="font-semibold" style={{ color: 'var(--clay-text)' }}>{formatCurrency(row.totalPayment)}</td>
                        <td className="font-bold" style={{ color: row.finalBalance === 0 ? 'var(--clay-green)' : 'var(--clay-text)' }}>
                          {row.finalBalance === 0 ? '¡Pagada!' : formatCurrency(row.finalBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content animate-scale-in max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b" style={{ borderColor: '#d4c4b4' }}>
              <h3 className="text-lg font-display font-bold" style={{ color: 'var(--clay-text)' }}>Guardar escenario</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="input-label">Nombre del escenario</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ej: Pago rápido Tarjeta Rappi"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
              <div>
                <label className="input-label">Tipo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSaveStatus('draft')}
                    className={`flex-1 py-2.5 text-sm font-semibold  transition-all ${saveStatus === 'draft' ? 'clay-btn-primary' : 'clay-btn'}`}
                  >
                    Borrador
                  </button>
                  <button
                    onClick={() => setSaveStatus('permanent')}
                    className={`flex-1 py-2.5 text-sm font-semibold  transition-all ${saveStatus === 'permanent' ? 'clay-btn-primary' : 'clay-btn'}`}
                  >
                    Permanente
                  </button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--clay-text-muted)' }}>
                  {saveStatus === 'draft' ? 'Se sobrescribirá al guardar otro con el mismo nombre' : 'Se conserva hasta que lo elimines manualmente'}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowSaveModal(false)} className="clay-btn px-4 py-2 text-sm">Cancelar</button>
                <button onClick={handleSave} className="clay-btn-primary px-4 py-2 text-sm">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="modal-content animate-scale-in max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#d4c4b4' }}>
              <h3 className="text-lg font-display font-bold" style={{ color: 'var(--clay-text)' }}>Mis escenarios</h3>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
                <button onClick={() => fileInputRef.current?.click()} className="clay-btn px-3 py-1.5 text-xs">
                  Importar
                </button>
              </div>
            </div>
            <div className="p-5 max-h-96 overflow-y-auto">
              {savedList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'var(--clay-text-muted)' }}>No hay escenarios guardados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedList.map(sc => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between p-3  transition-all cursor-pointer hover:bg-black/5"
                      style={{ background: '#e8ddd0' }}
                      onClick={() => handleLoad(sc)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate" style={{ color: 'var(--clay-text)' }}>{sc.name}</span>
                          <span className={`clay-badge text-2xs px-2 py-0.5 ${sc.status === 'permanent' ? '' : ''}`}
                            style={{
                              background: sc.status === 'permanent'
                                ? 'linear-gradient(145deg, #d4a574, #c49464)'
                                : '#e0d4c8',
                              color: sc.status === 'permanent' ? '#fff' : 'var(--clay-text-muted)',
                              fontSize: '0.6rem',
                            }}
                          >
                            {sc.status === 'permanent' ? 'Perm' : 'Borrador'}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--clay-text-muted)' }}>
                          {new Date(sc.updatedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleExport(sc.id)}
                          className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                          title="Exportar"
                        >
                          <CloudArrowDownIcon className="h-4 w-4" style={{ color: 'var(--clay-text-muted)' }} />
                        </button>
                        <button
                          onClick={() => handleDeleteScenario(sc.id, sc.name)}
                          className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" style={{ color: 'var(--clay-red)' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end" style={{ borderColor: '#d4c4b4' }}>
              <button onClick={() => setShowLoadModal(false)} className="clay-btn px-4 py-2 text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}