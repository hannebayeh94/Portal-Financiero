import { useState, useEffect, useMemo, useRef } from 'react'
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
import { formatCurrency } from '../utils/formatters'
import { saveScenario, listScenarios, deleteScenario, exportScenario, importScenario } from '../utils/scenarios'
import toast from 'react-hot-toast'
import {
  ChartBarIcon,
  WalletIcon,
  BanknotesIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  PlusCircleIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  CloudArrowDownIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function projectAccount(balance, annualRate, monthlyContribution, months) {
  const monthlyRate = annualRate / 100 / 12
  const monthlyAdd = parseFloat(monthlyContribution) || 0
  const rows = []
  let currentBalance = parseFloat(balance) || 0
  const startDate = new Date()
  startDate.setDate(1)

  for (let m = 1; m <= months; m++) {
    const interest = currentBalance * monthlyRate
    currentBalance = currentBalance + interest + monthlyAdd

    const date = new Date(startDate)
    date.setMonth(date.getMonth() + m - 1)
    const monthName = MONTHS[date.getMonth()]
    const year = date.getFullYear()

    rows.push({
      month: m,
      label: `${monthName.slice(0, 3)} ${year}`,
      balance: Math.round(currentBalance * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      contribution: monthlyAdd,
    })
  }
  return rows
}

const ACCOUNT_COLORS = [
  { border: '#d4a574', bg: 'rgba(212, 165, 116, 0.15)' },
  { border: '#7dab7d', bg: 'rgba(125, 171, 125, 0.15)' },
  { border: '#c47a7a', bg: 'rgba(196, 122, 122, 0.15)' },
  { border: '#a08090', bg: 'rgba(160, 128, 144, 0.15)' },
  { border: '#b8a070', bg: 'rgba(184, 160, 112, 0.15)' },
  { border: '#70a0b8', bg: 'rgba(112, 160, 184, 0.15)' },
]

export default function Projections() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(12)
  const [contributions, setContributions] = useState({})

  const [planActive, setPlanActive] = useState(false)
  const [planTotal, setPlanTotal] = useState('')
  const [distributionMode, setDistributionMode] = useState('percentage')
  const [planDist, setPlanDist] = useState({})

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/savings?active=true')
      setAccounts(res.data)
      const initial = {}
      res.data.forEach(acct => { initial[acct.id] = '' })
      setContributions(initial)
      const distInit = {}
      res.data.forEach(acct => { distInit[acct.id] = '' })
      setPlanDist(distInit)
    } catch (error) {
      toast.error('Error al cargar cuentas de ahorro')
    } finally {
      setLoading(false)
    }
  }

  const effectiveContributions = useMemo(() => {
    if (!planActive || !planTotal) return contributions

    const total = parseFloat(planTotal) || 0
    if (total <= 0) return contributions

    const dist = { ...contributions }
    let remaining = total
    const entries = Object.keys(planDist)
    const lastIdx = entries.length - 1

    if (distributionMode === 'percentage') {
      const pcts = entries.map(id => Math.min(100, Math.max(0, parseFloat(planDist[id]) || 0)))
      const totalPct = pcts.reduce((s, v) => s + v, 0)
      if (totalPct <= 0) return contributions
      entries.forEach((id, i) => {
        if (i === lastIdx) {
          dist[id] = String(Math.round(remaining))
        } else {
          const val = Math.round(total * (parseFloat(planDist[id]) || 0) / totalPct)
          dist[id] = String(val)
          remaining -= val
        }
      })
    } else {
      entries.forEach((id, i) => {
        const val = Math.min(remaining, Math.max(0, parseFloat(planDist[id]) || 0))
        dist[id] = String(val)
        remaining -= val
        if (i === lastIdx && remaining > 0) {
          dist[id] = String(parseFloat(dist[id]) + remaining)
        }
      })
    }
    return dist
  }, [planActive, planTotal, planDist, distributionMode, contributions])

  const noPlanProjections = useMemo(() => {
    return accounts.map(account => ({
      ...account,
      projection: projectAccount(account.current_balance, parseFloat(account.interest_rate) || 0, '', months),
    }))
  }, [accounts, months])

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveStatus, setSaveStatus] = useState('draft')
  const [savedList, setSavedList] = useState([])
  const fileInputRef = useRef(null)

  const getSnapshot = () => ({
    months,
    contributions,
    planActive,
    planTotal,
    distributionMode,
    planDist,
  })

  const restoreSnapshot = (snapshot) => {
    setMonths(snapshot.months)
    setContributions(snapshot.contributions)
    setPlanActive(snapshot.planActive)
    setPlanTotal(snapshot.planTotal)
    setDistributionMode(snapshot.distributionMode)
    setPlanDist(snapshot.planDist)
  }

  const handleSave = () => {
    if (!saveName.trim()) { toast.error('Ingresa un nombre para el escenario'); return }
    try {
      saveScenario('projections', getSnapshot(), saveName.trim(), saveStatus)
      toast.success(`Escenario "${saveName}" guardado`)
      setShowSaveModal(false)
      setSaveName('')
    } catch (error) {
      toast.error('Error al guardar: ' + error.message)
    }
  }

  const openLoadModal = () => {
    setSavedList(listScenarios('projections'))
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
      setSavedList(listScenarios('projections'))
      toast.success(`Escenario "${data.name}" importado`)
    } catch (error) {
      toast.error(error.message || 'Error al importar')
    }
    e.target.value = ''
  }

  const projections = useMemo(() => {
    return accounts.map(account => ({
      ...account,
      projection: projectAccount(account.current_balance, parseFloat(account.interest_rate) || 0, effectiveContributions[account.id], months),
    }))
  }, [accounts, months, effectiveContributions])

  const totalProjection = useMemo(() => {
    if (projections.length === 0) return []
    return Array.from({ length: months }, (_, m) => {
      let total = 0
      projections.forEach(p => { total += p.projection[m]?.balance || 0 })
      return {
        month: m + 1,
        label: projections[0].projection[m]?.label || `Mes ${m + 1}`,
        total: Math.round(total * 100) / 100,
      }
    })
  }, [projections, months])

  const noPlanTotalProjection = useMemo(() => {
    if (noPlanProjections.length === 0) return []
    return Array.from({ length: months }, (_, m) => {
      let total = 0
      noPlanProjections.forEach(p => { total += p.projection[m]?.balance || 0 })
      return { month: m + 1, total: Math.round(total * 100) / 100 }
    })
  }, [noPlanProjections, months])

  const totalCurrentBalance = accounts.reduce((sum, a) => sum + (parseFloat(a.current_balance) || 0), 0)
  const totalProjectedBalance = totalProjection[totalProjection.length - 1]?.total || 0
  const totalNoPlanBalance = noPlanTotalProjection[noPlanTotalProjection.length - 1]?.total || 0
  const totalContributionsPerMonth = Object.values(effectiveContributions).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const totalInterest = projections.reduce((sum, p) => sum + p.projection.reduce((s, r) => s + r.interest, 0), 0)

  const hasPlanData = planActive && planTotal && Object.values(planDist).some(v => parseFloat(v) > 0)

  const chartData = {
    labels: totalProjection.map(r => r.label),
    datasets: [
      ...(hasPlanData ? [{
        label: 'Sin plan (solo intereses)',
        data: noPlanTotalProjection.map(r => r.total),
        borderColor: '#b0a090',
        backgroundColor: 'rgba(176, 160, 144, 0.08)',
        fill: false,
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
        borderDash: [4, 4],
      }] : []),
      ...projections.map((account, idx) => ({
        label: account.name,
        data: account.projection.map(r => r.balance),
        borderColor: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length].border,
        backgroundColor: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length].bg,
        fill: false,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      })),
      {
        label: hasPlanData ? 'Total con plan' : 'Total',
        data: totalProjection.map(r => r.total),
        borderColor: '#2d3436',
        backgroundColor: 'rgba(45, 52, 54, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 3,
        borderDash: hasPlanData ? [] : [6, 3],
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#8a7a6a',
          font: { size: 11, family: 'Inter' },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#f5ebe0',
        titleColor: '#2d3436',
        bodyColor: '#2d3436',
        borderColor: '#d4c4b4',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8a7a6a', font: { size: 10, family: 'Inter' }, maxRotation: 45, maxTicksLimit: 12 },
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

  const getGoalMonths = (balance, goal, annualRate, monthlyContrib) => {
    const g = parseFloat(goal)
    const b = parseFloat(balance) || 0
    if (b >= g) return 0
    const proj = projectAccount(b, annualRate, monthlyContrib, 600)
    for (const row of proj) {
      if (row.balance >= g) return row.month
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '4px solid #e0d4c8', borderTopColor: 'var(--clay-accent)' }}></div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6" style={{ background: 'var(--bg-gradient)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--clay-text)' }}>
            Proyecciones de Ahorro
          </h1>
          <p className="mt-1" style={{ color: 'var(--clay-text-muted)' }}>
            Proyecta el crecimiento de tus ahorros con o sin plan de aportes mensuales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openLoadModal} className="clay-btn px-3 py-2.5 text-sm inline-flex items-center gap-1.5">
            <FolderOpenIcon className="h-4 w-4" />
            Cargar
          </button>
          <button onClick={() => { setSaveName(''); setSaveStatus('draft'); setShowSaveModal(true) }} className="clay-btn-primary px-3 py-2.5 text-sm inline-flex items-center gap-1.5">
            <DocumentTextIcon className="h-4 w-4" />
            Guardar
          </button>
          <div className="flex items-center gap-2 ml-2 pl-3" style={{ borderLeft: '2px solid #d4c4b4' }}>
            <label className="text-xs font-semibold" style={{ color: 'var(--clay-text-muted)' }}>Período:</label>
            <select
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="clay-input px-4 py-2.5 text-sm font-semibold"
              style={{ width: 'auto', minWidth: '120px' }}
            >
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
              <option value={24}>24 meses</option>
              <option value={36}>36 meses</option>
              <option value={60}>60 meses (5 años)</option>
            </select>
          </div>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="clay-card p-12 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: '#e8ddd0', boxShadow: 'var(--clay-shadow-inset)' }}>
            <WalletIcon className="h-10 w-10" style={{ color: 'var(--clay-text-muted)' }} />
          </div>
          <h3 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--clay-text)' }}>No hay cuentas de ahorro</h3>
          <p className="max-w-md mx-auto mb-6" style={{ color: 'var(--clay-text-muted)' }}>
            Crea cuentas de ahorro en el módulo de Ahorros para ver sus proyecciones aquí
          </p>
          <a href="/savings" className="clay-btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm  no-underline">
            <WalletIcon className="h-4 w-4" />
            Ir a Ahorros
          </a>
        </div>
      ) : (
        <>
          {/* Plan de Ahorro */}
          <div className="clay-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10  flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #7dab7d, #6d9b6d)', boxShadow: 'var(--clay-shadow-sm)' }}>
                  <PlusCircleIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Plan de Ahorro Mensual</h3>
                  <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>
                    Define cuánto ahorrarás cada mes y cómo distribuirlo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPlanActive(!planActive)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                  planActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                  planActive ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {planActive && (
              <div className="space-y-4 animate-fade-in">
                <div className="clay-divider" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--clay-text-muted)' }}>
                      Ahorro total mensual
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--clay-text-muted)' }}>$</span>
                      <input
                        type="number"
                        step="1"
                        value={planTotal}
                        onChange={(e) => setPlanTotal(e.target.value)}
                        placeholder="1,000,000"
                        className="clay-input w-full px-3 py-3 pl-7 text-lg font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--clay-text-muted)' }}>
                      Modo de distribución
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDistributionMode('percentage')}
                        className={`flex-1 py-2.5 text-sm font-semibold  transition-all ${
                          distributionMode === 'percentage'
                            ? 'clay-btn-primary'
                            : 'clay-btn'
                        }`}
                      >
                        Porcentaje %
                      </button>
                      <button
                        onClick={() => setDistributionMode('fixed')}
                        className={`flex-1 py-2.5 text-sm font-semibold  transition-all ${
                          distributionMode === 'fixed'
                            ? 'clay-btn-primary'
                            : 'clay-btn'
                        }`}
                      >
                        Valor fijo $
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--clay-text-muted)' }}>
                    Distribución por cuenta
                  </p>
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center gap-3 px-3 py-2 " style={{ background: '#e8ddd0' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--clay-text)' }}>{account.name}</p>
                          <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>
                            Saldo: {formatCurrency(account.current_balance)}
                          </p>
                        </div>
                        <div className="relative" style={{ width: '120px' }}>
                          {distributionMode === 'percentage' ? (
                            <>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={planDist[account.id] || ''}
                                onChange={(e) => setPlanDist(prev => ({ ...prev, [account.id]: e.target.value }))}
                                placeholder="0"
                                className="clay-input w-full px-3 py-2 pr-8 text-sm font-semibold text-center"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--clay-text-muted)' }}>%</span>
                            </>
                          ) : (
                            <>
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--clay-text-muted)' }}>$</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={planDist[account.id] || ''}
                                onChange={(e) => setPlanDist(prev => ({ ...prev, [account.id]: e.target.value }))}
                                placeholder="0"
                                className="clay-input w-full px-3 py-2 pl-7 text-sm font-semibold text-right"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {hasPlanData && (
                  <div className="flex items-center justify-between px-4 py-3 " style={{ background: 'rgba(125, 171, 125, 0.15)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--clay-green)' }}>
                      Total a aportar mensualmente
                    </span>
                    <span className="text-lg font-bold" style={{ color: 'var(--clay-text)' }}>
                      {formatCurrency(totalContributionsPerMonth)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="clay-card-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--clay-text-muted)' }}>Saldo actual total</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--clay-text)' }}>{formatCurrency(totalCurrentBalance)}</p>
            </div>
            <div className="clay-card-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--clay-text-muted)' }}>Proyectado a {months} meses</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--clay-accent)' }}>{formatCurrency(totalProjectedBalance)}</p>
            </div>
            <div className="clay-card-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--clay-text-muted)' }}>Intereses generados</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--clay-green)' }}>{formatCurrency(totalInterest)}</p>
            </div>
            <div className="clay-card-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--clay-text-muted)' }}>Cuentas activas</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--clay-text)' }}>{accounts.length}</p>
            </div>
          </div>

          {/* Diff banner when plan is active */}
          {hasPlanData && (
            <div className="clay-card-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5" style={{ color: 'var(--clay-green)' }} />
                <span className="text-sm" style={{ color: 'var(--clay-text)' }}>
                  Con tu plan de <strong>{formatCurrency(totalContributionsPerMonth)}/mes</strong> pasarías de{' '}
                  <strong>{formatCurrency(totalNoPlanBalance)}</strong> a{' '}
                  <strong>{formatCurrency(totalProjectedBalance)}</strong> en {months} meses
                </span>
              </div>
              <span className="text-lg font-bold" style={{ color: 'var(--clay-green)' }}>
                +{formatCurrency(totalProjectedBalance - totalNoPlanBalance)}
              </span>
            </div>
          )}

          {/* Main Chart */}
          {totalProjection.length > 0 && (
            <div className="clay-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10  flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #d4a574, #c49464)', boxShadow: 'var(--clay-shadow-sm)' }}>
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Evolución del patrimonio</h3>
              </div>
              <div className="h-80">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Per-Account Projections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projections.map((account, idx) => {
              const first = account.projection[0]
              const last = account.projection[account.projection.length - 1]
              const growth = first ? ((last.balance - first.balance) / first.balance) * 100 : 0
              const contrib = effectiveContributions[account.id]
              const goalMonths = account.goal_amount
                ? getGoalMonths(account.current_balance, account.goal_amount, parseFloat(account.interest_rate) || 0, contrib)
                : null
              const goalProgress = account.goal_amount
                ? Math.min(100, (parseFloat(account.current_balance) / parseFloat(account.goal_amount)) * 100)
                : null

              const miniChartData = {
                labels: account.projection.filter((_, i) => i % Math.max(1, Math.floor(months / 6)) === 0 || i === account.projection.length - 1).map(r => r.label),
                datasets: [{
                  data: account.projection.filter((_, i) => i % Math.max(1, Math.floor(months / 6)) === 0 || i === account.projection.length - 1).map(r => r.balance),
                  borderColor: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length].border,
                  backgroundColor: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length].bg,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  borderWidth: 2,
                }],
              }

              return (
                <div key={account.id} className="clay-card p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10  flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #e8ddd0, #d4c4b4)', boxShadow: 'var(--clay-shadow-sm)' }}>
                        <BanknotesIcon className="h-5 w-5" style={{ color: 'var(--clay-text)' }} />
                      </div>
                      <div>
                        <h4 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>{account.name}</h4>
                        <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>{account.bank} &middot; {account.interest_rate}% anual</p>
                      </div>
                    </div>
                    <span className="clay-badge text-xs">
                      {account.type === 'standard' ? 'Estándar' : account.type === 'goal' ? 'Meta' : 'Inversión'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Saldo actual</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--clay-text)' }}>{formatCurrency(account.current_balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Proyectado</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--clay-accent)' }}>{last ? formatCurrency(last.balance) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Crecimiento</p>
                      <p className="text-lg font-bold" style={{ color: growth >= 0 ? 'var(--clay-green)' : 'var(--clay-red)' }}>
                        {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Intereses</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--clay-green)' }}>
                        {formatCurrency(account.projection.reduce((s, r) => s + r.interest, 0))}
                      </p>
                    </div>
                  </div>

                  {/* Monthly contribution */}
                  {!planActive && (
                    <div className="mb-4">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--clay-text-muted)' }}>
                        Aporte mensual adicional
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--clay-text-muted)' }}>$</span>
                        <input
                          type="number"
                          step="1"
                          value={contributions[account.id] || ''}
                          onChange={(e) => setContributions(prev => ({ ...prev, [account.id]: e.target.value }))}
                          placeholder="0"
                          className="clay-input w-full px-3 py-2 pl-7 text-sm"
                        />
                      </div>
                    </div>
                  )}
                  {planActive && (
                    <div className="mb-4 px-3 py-2 " style={{ background: 'rgba(125, 171, 125, 0.1)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--clay-green)' }}>Aporte vía plan</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--clay-text)' }}>
                          {formatCurrency(contrib ? parseFloat(contrib) : 0)}/mes
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Goal Progress */}
                  {goalProgress !== null && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>
                          Meta: {formatCurrency(account.goal_amount)}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--clay-text)' }}>
                          {Math.round(goalProgress)}%
                        </span>
                      </div>
                      <div className="clay-progress" style={{ height: '8px' }}>
                        <div className="clay-progress-bar" style={{ width: `${goalProgress}%` }} />
                      </div>
                      {goalMonths !== null && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <ClockIcon className="h-3.5 w-3.5" style={{ color: 'var(--clay-text-muted)' }} />
                          <span className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>
                            {goalMonths === 0
                              ? '¡Meta alcanzada!'
                              : `Meta alcanzable en ${goalMonths} meses (${Math.floor(goalMonths / 12)}a ${goalMonths % 12}m)`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="h-32">
                    <Line
                      data={miniChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                        scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
                        elements: { point: { radius: 0 } },
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparison Summary when plan is active */}
          {hasPlanData && (
            <div className="clay-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10  flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #7dab7d, #6d9b6d)', boxShadow: 'var(--clay-shadow-sm)' }}>
                  <ArrowsRightLeftIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Comparativa: Sin plan vs Con plan</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4  text-center" style={{ background: '#e8ddd0' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--clay-text-muted)' }}>Sin plan</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--clay-text)' }}>{formatCurrency(totalNoPlanBalance)}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--clay-text-muted)' }}>solo intereses</p>
                </div>
                <div className="p-4  text-center" style={{ background: 'rgba(125, 171, 125, 0.15)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--clay-green)' }}>Con plan</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--clay-green)' }}>{formatCurrency(totalProjectedBalance)}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--clay-text-muted)' }}>ahorrando {formatCurrency(totalContributionsPerMonth)}/mes</p>
                </div>
                <div className="p-4  text-center" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--clay-accent)' }}>Diferencia</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--clay-accent)' }}>
                    +{formatCurrency(totalProjectedBalance - totalNoPlanBalance)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--clay-text-muted)' }}>
                    {totalNoPlanBalance > 0
                      ? `+${(((totalProjectedBalance - totalNoPlanBalance) / totalNoPlanBalance) * 100).toFixed(1)}%`
                      : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detail Table */}
          {projections.length > 0 && (
            <div className="clay-card overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Detalle mensual</h3>
                <span className="clay-badge text-xs">
                  {formatCurrency(totalCurrentBalance)} → {formatCurrency(totalProjectedBalance)}
                </span>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="clay-table w-full">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Mes</th>
                      {projections.map(account => (
                        <th key={account.id}>{account.name}</th>
                      ))}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totalProjection.map((row, idx) => (
                      <tr key={row.month}>
                        <td className="font-semibold">
                          <span className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>{row.label}</span>
                        </td>
                        {projections.map(account => (
                          <td key={account.id} style={{ color: 'var(--clay-text)' }}>
                            {formatCurrency(account.projection[idx]?.balance || 0)}
                          </td>
                        ))}
                        <td className="font-bold" style={{ color: 'var(--clay-accent)' }}>
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
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
                  placeholder="Ej: Ahorro agresivo 2026"
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
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${saveStatus === 'draft' ? 'clay-btn-primary' : 'clay-btn'}`}
                  >
                    Borrador
                  </button>
                  <button
                    onClick={() => setSaveStatus('permanent')}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${saveStatus === 'permanent' ? 'clay-btn-primary' : 'clay-btn'}`}
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
                    <div key={sc.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--clay-card)', border: '1px solid rgba(255,255,255,0.5)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--clay-text)' }}>{sc.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--clay-text-muted)' }}>
                          {sc.status === 'draft' ? 'Borrador' : 'Permanente'} · {new Date(sc.updatedAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleLoad(sc)} className="clay-btn-primary px-3 py-1.5 text-xs font-semibold">Cargar</button>
                        <button onClick={() => handleExport(sc.id)} className="clay-btn px-2 py-1.5 text-xs" title="Exportar">
                          <CloudArrowDownIcon className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteScenario(sc.id, sc.name)} className="clay-btn-danger px-2 py-1.5 text-xs" title="Eliminar">
                          <TrashIcon className="h-3.5 w-3.5" />
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
    </>
  )
}