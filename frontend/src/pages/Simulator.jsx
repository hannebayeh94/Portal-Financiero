import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
import { formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  TrashIcon,
  Cog6ToothIcon,
  ScaleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const HORIZON_OPTIONS = [6, 12, 24, 36]
const ALLOC_ROWS = [
  { key: 'savings', label: 'Ahorro', color: '#7dab7d' },
  { key: 'investment', label: 'Inversión', color: '#70a0b8' },
  { key: 'emergency', label: 'Emergencias', color: '#d4a574' },
]

function currentMonthStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const DEFAULT_CONFIG = {
  startMonth: currentMonthStr(),
  horizonMonths: 12,
  baseIncome: 0,
  baseExpense: 0,
  startingBalance: 0,
  includeDebts: true,
  debtThreshold: 0,
  allocations: { mode: 'percentage', savings: 10, investment: 5, emergency: 5 },
  overrides: {},
}

export default function Simulator() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)

  const [savedList, setSavedList] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [currentId, setCurrentId] = useState(null)

  const debounceRef = useRef(null)

  // Carga inicial: siembra ingreso/gasto base desde datos reales y umbral desde deudas.
  useEffect(() => {
    ;(async () => {
      try {
        const year = new Date().getFullYear()
        const [evoRes, debtRes] = await Promise.all([
          api.get(`/reports/monthly-evolution?year=${year}`),
          api.get('/debts').catch(() => ({ data: [] })),
        ])
        const rows = evoRes.data?.data || []
        const withIncome = rows.filter(r => r.income > 0)
        const withExpense = rows.filter(r => r.expenses > 0)
        const avgIncome = withIncome.length
          ? Math.round(withIncome.reduce((s, r) => s + r.income, 0) / withIncome.length)
          : 0
        const avgExpense = withExpense.length
          ? Math.round(withExpense.reduce((s, r) => s + r.expenses, 0) / withExpense.length)
          : 0
        const activeDebts = (debtRes.data || []).filter(d => d.status === 'active')
        const totalDebt = activeDebts.reduce((s, d) => s + (parseFloat(d.current_balance) || 0), 0)

        setConfig(prev => ({
          ...prev,
          baseIncome: avgIncome,
          baseExpense: avgExpense,
          debtThreshold: totalDebt ? Math.round(totalDebt * 1.5) : 0,
        }))
      } catch (error) {
        toast.error('No se pudieron cargar tus datos base')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const compute = useCallback(async (cfg) => {
    setComputing(true)
    try {
      const res = await api.post('/simulations/compute', { config: cfg })
      setResult(res.data)
    } catch (error) {
      toast.error('Error al calcular la simulación')
    } finally {
      setComputing(false)
    }
  }, [])

  // Recalcula (con debounce) cada vez que cambia la configuración.
  useEffect(() => {
    if (loading) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => compute(config), 400)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [config, loading, compute])

  const setField = (field, value) => setConfig(prev => ({ ...prev, [field]: value }))
  const setAlloc = (key, value) =>
    setConfig(prev => ({ ...prev, allocations: { ...prev.allocations, [key]: value } }))
  const setOverride = (idx, field, value) =>
    setConfig(prev => {
      const overrides = { ...prev.overrides }
      const entry = { ...(overrides[idx] || {}) }
      if (value === '' || value === null) delete entry[field]
      else entry[field] = field === 'note' ? value : parseFloat(value) || 0
      if (Object.keys(entry).length === 0) delete overrides[idx]
      else overrides[idx] = entry
      return { ...prev, overrides }
    })
  const resetMonth = (idx) =>
    setConfig(prev => {
      const overrides = { ...prev.overrides }
      delete overrides[idx]
      return { ...prev, overrides }
    })

  const months = result?.months || []
  const alerts = result?.alerts || []
  const summary = result?.summary || {}
  const debtCycles = result?.debtCycles || []
  const byCycle = summary.byCycle || []

  const allocTotalPct = ALLOC_ROWS.reduce((s, r) => s + (parseFloat(config.allocations[r.key]) || 0), 0)

  const refetchSaved = async () => {
    try {
      const res = await api.get('/simulations')
      setSavedList(res.data)
    } catch {
      toast.error('Error al cargar simulaciones guardadas')
    }
  }

  const handleSave = async () => {
    if (!saveName.trim()) { toast.error('Ingresa un nombre'); return }
    try {
      const res = await api.post('/simulations', { name: saveName.trim(), config })
      setCurrentId(res.data.id)
      toast.success(`Simulación "${saveName}" guardada`)
      setShowSaveModal(false)
      setSaveName('')
    } catch {
      toast.error('Error al guardar')
    }
  }

  const handleUpdate = async () => {
    if (!currentId) { setSaveName(''); setShowSaveModal(true); return }
    try {
      await api.put(`/simulations/${currentId}`, { config })
      toast.success('Simulación actualizada')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const openLoadModal = async () => { await refetchSaved(); setShowLoadModal(true) }

  const handleLoad = (sim) => {
    setConfig({ ...DEFAULT_CONFIG, ...sim.config, allocations: { ...DEFAULT_CONFIG.allocations, ...(sim.config.allocations || {}) }, overrides: sim.config.overrides || {} })
    setCurrentId(sim.id)
    setShowLoadModal(false)
    toast.success(`Simulación "${sim.name}" cargada`)
  }

  const handleDelete = async (id, name) => {
    try {
      await api.delete(`/simulations/${id}`)
      setSavedList(prev => prev.filter(s => s.id !== id))
      if (currentId === id) setCurrentId(null)
      toast.success(`"${name}" eliminada`)
    } catch {
      toast.error('Error al eliminar')
    }
  }

  // ---- Gráficos ----
  const lineData = {
    labels: months.map(m => m.label),
    datasets: [
      {
        label: 'Saldo acumulado',
        data: months.map(m => m.accumulated),
        borderColor: '#2d3436',
        backgroundColor: 'rgba(45, 52, 54, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 6,
        borderWidth: 3,
      },
      {
        label: 'Saldo disponible del mes',
        data: months.map(m => m.available),
        borderColor: '#d4a574',
        backgroundColor: 'rgba(212, 165, 116, 0.12)',
        fill: false,
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
      },
    ],
  }

  const barData = {
    labels: months.map(m => m.label),
    datasets: [
      { label: 'Ingresos', data: months.map(m => m.income), backgroundColor: '#7dab7d' },
      { label: 'Gastos', data: months.map(m => m.expense), backgroundColor: '#c47a7a' },
      { label: 'Cuota deudas', data: months.map(m => m.debtPayment), backgroundColor: '#a08090' },
    ],
  }

  const chartOptions = (stacked = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#8a7a6a', font: { size: 11, family: 'Inter' }, padding: 14, usePointStyle: true, pointStyle: 'circle' },
      },
      tooltip: {
        backgroundColor: '#f5ebe0', titleColor: '#2d3436', bodyColor: '#2d3436',
        borderColor: '#d4c4b4', borderWidth: 1, padding: 12, cornerRadius: 12,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` },
      },
    },
    scales: {
      x: { stacked, grid: { display: false }, ticks: { color: '#8a7a6a', font: { size: 10, family: 'Inter' }, maxRotation: 45, maxTicksLimit: 12 } },
      y: {
        stacked,
        grid: { color: 'rgba(212, 196, 180, 0.3)' },
        ticks: { color: '#8a7a6a', font: { size: 11, family: 'Inter' }, callback: (v) => '$' + v.toLocaleString('es-CO') },
      },
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '4px solid #e0d4c8', borderTopColor: 'var(--clay-accent)' }}></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6" style={{ background: 'var(--bg-gradient)' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--clay-text)' }}>Simulador Financiero</h1>
            <p className="mt-1" style={{ color: 'var(--clay-text-muted)' }}>
              Proyecta tu flujo de caja mes a mes con deudas, asignaciones y escenarios hipotéticos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openLoadModal} className="clay-btn px-3 py-2.5 text-sm inline-flex items-center gap-1.5">
              <FolderOpenIcon className="h-4 w-4" /> Cargar
            </button>
            {currentId && (
              <button onClick={handleUpdate} className="clay-btn px-3 py-2.5 text-sm inline-flex items-center gap-1.5">
                Actualizar
              </button>
            )}
            <button onClick={() => { setSaveName(''); setShowSaveModal(true) }} className="clay-btn-primary px-3 py-2.5 text-sm inline-flex items-center gap-1.5">
              <DocumentTextIcon className="h-4 w-4" /> Guardar como
            </button>
          </div>
        </div>

        {/* Configuración base */}
        <div className="clay-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #d4a574, #c49464)', boxShadow: 'var(--clay-shadow-sm)' }}>
              <Cog6ToothIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Configuración</h3>
              <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Valores base pre-cargados desde tus datos reales — edítalos libremente</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Mes inicial">
              <input type="month" value={config.startMonth} onChange={(e) => setField('startMonth', e.target.value)} className="clay-input w-full px-3 py-2.5 text-sm font-semibold" />
            </Field>
            <Field label="Horizonte">
              <select value={config.horizonMonths} onChange={(e) => setField('horizonMonths', parseInt(e.target.value))} className="clay-input w-full px-3 py-2.5 text-sm font-semibold">
                {HORIZON_OPTIONS.map(m => <option key={m} value={m}>{m} meses</option>)}
              </select>
            </Field>
            <Field label="Saldo inicial">
              <MoneyInput value={config.startingBalance} onChange={(v) => setField('startingBalance', v)} />
            </Field>
            <Field label="Ingreso base mensual">
              <MoneyInput value={config.baseIncome} onChange={(v) => setField('baseIncome', v)} />
            </Field>
            <Field label="Gasto base mensual (sin cuotas de deuda)">
              <MoneyInput value={config.baseExpense} onChange={(v) => setField('baseExpense', v)} />
            </Field>
            <Field label="Umbral de alerta de deuda">
              <MoneyInput value={config.debtThreshold} onChange={(v) => setField('debtThreshold', v)} />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setField('includeDebts', !config.includeDebts)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${config.includeDebts ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${config.includeDebts ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm" style={{ color: 'var(--clay-text)' }}>Integrar mis deudas reales (amortización automática de cuotas e intereses)</span>
          </div>
        </div>

        {/* Asignaciones */}
        <div className="clay-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #7dab7d, #6d9b6d)', boxShadow: 'var(--clay-shadow-sm)' }}>
                <ScaleIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Asignación automática</h3>
                <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>Del excedente de cada mes, separa para ahorro, inversión y emergencias</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAlloc('mode', 'percentage')} className={`px-3 py-2 text-sm font-semibold ${config.allocations.mode === 'percentage' ? 'clay-btn-primary' : 'clay-btn'}`}>%</button>
              <button onClick={() => setAlloc('mode', 'fixed')} className={`px-3 py-2 text-sm font-semibold ${config.allocations.mode === 'fixed' ? 'clay-btn-primary' : 'clay-btn'}`}>$ fijo</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ALLOC_ROWS.map(row => (
              <div key={row.key} className="px-4 py-3 rounded-xl" style={{ background: '#e8ddd0' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: row.color }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--clay-text)' }}>{row.label}</span>
                </div>
                {config.allocations.mode === 'percentage' ? (
                  <div className="relative">
                    <input type="number" min="0" max="100" value={config.allocations[row.key] ?? ''} onChange={(e) => setAlloc(row.key, parseFloat(e.target.value) || 0)} className="clay-input w-full px-3 py-2 pr-8 text-sm font-semibold text-center" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--clay-text-muted)' }}>%</span>
                  </div>
                ) : (
                  <MoneyInput value={config.allocations[row.key] || 0} onChange={(v) => setAlloc(row.key, v)} />
                )}
              </div>
            ))}
          </div>
          {config.allocations.mode === 'percentage' && allocTotalPct > 100 && (
            <p className="text-xs mt-2" style={{ color: 'var(--clay-red)' }}>La suma de porcentajes ({allocTotalPct}%) supera el 100% del excedente.</p>
          )}
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="clay-card p-5" style={{ borderLeft: '4px solid var(--clay-red)' }}>
            <div className="flex items-center gap-2 mb-3">
              <ExclamationTriangleIcon className="h-6 w-6" style={{ color: 'var(--clay-red)' }} />
              <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Alertas ({alerts.length})</h3>
            </div>
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: a.type === 'debt' ? 'rgba(160, 128, 144, 0.15)' : 'rgba(196, 122, 122, 0.15)', color: 'var(--clay-text)' }}>
                  {a.type === 'debt' ? <BanknotesIcon className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <ArrowTrendingDownIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  <span>{a.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Disponible acumulado" value={formatCurrency(summary.endBalance || 0)} accent={(summary.endBalance || 0) >= 0 ? 'var(--clay-accent)' : 'var(--clay-red)'} />
          <StatCard label="Apartado acumulado" value={formatCurrency(summary.savedEndBalance || 0)} accent="var(--clay-green)" />
          <StatCard label="Saldo mínimo del mes" value={formatCurrency(summary.minBalance || 0)} accent={(summary.minBalance || 0) >= 0 ? 'var(--clay-green)' : 'var(--clay-red)'} />
          <StatCard label="Intereses de deuda" value={formatCurrency(summary.totalDebtInterest || 0)} accent="var(--clay-text)" />
        </div>

        {/* Gráficos */}
        {months.length > 0 && (
          <>
            <div className="clay-card p-6">
              <h3 className="font-display font-bold mb-4" style={{ color: 'var(--clay-text)' }}>Saldo disponible y acumulado</h3>
              <div className="h-80"><Line data={lineData} options={chartOptions(false)} /></div>
            </div>
            <div className="clay-card p-6">
              <h3 className="font-display font-bold mb-4" style={{ color: 'var(--clay-text)' }}>Ingresos vs gastos vs cuota de deudas</h3>
              <div className="h-80"><Bar data={barData} options={chartOptions(false)} /></div>
            </div>
          </>
        )}

        {/* Tabla editable mes a mes */}
        {months.length > 0 && (
          <div className="clay-card overflow-hidden">
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #70a0b8, #6090a8)', boxShadow: 'var(--clay-shadow-sm)' }}>
                  <CalendarDaysIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Detalle mensual (editable)</h3>
                  <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>
                    Edita el <strong>ingreso</strong> o <strong>gasto</strong> de cualquier mes (ej: prima en noviembre). Reconcilia:
                    Ingreso − Gasto − Cuota = <em>Excedente</em>; Excedente − Apartado = <em>Disponible</em>.
                  </p>
                </div>
              </div>
              {computing && <span className="text-xs whitespace-nowrap" style={{ color: 'var(--clay-text-muted)' }}>Calculando…</span>}
            </div>
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="clay-table w-full">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>Mes</th>
                    <th>Ingreso ✎</th>
                    <th>Gasto (op.) ✎</th>
                    <th>Cuota deuda</th>
                    <th>= Excedente</th>
                    <th>Ahorro</th>
                    <th>Inversión</th>
                    <th>Emerg.</th>
                    <th>= Disponible</th>
                    <th>Acum. disp.</th>
                    <th>Deuda rest.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => {
                    const ov = config.overrides[m.index] || {}
                    const incomeVal = ov.income ?? config.baseIncome
                    const expenseVal = ov.expense ?? config.baseExpense
                    return (
                      <tr key={m.index} style={m.overridden ? { background: 'rgba(112, 160, 184, 0.10)' } : undefined}>
                        <td className="font-semibold text-xs whitespace-nowrap" style={{ color: 'var(--clay-text-muted)' }}>{m.label}</td>
                        <td>
                          <input type="number" value={incomeVal} onChange={(e) => setOverride(m.index, 'income', e.target.value)} className="clay-input w-28 px-2 py-1.5 text-sm" style={{ color: 'var(--clay-green)' }} />
                        </td>
                        <td>
                          <input type="number" value={expenseVal} onChange={(e) => setOverride(m.index, 'expense', e.target.value)} className="clay-input w-28 px-2 py-1.5 text-sm" style={{ color: 'var(--clay-red)' }} />
                        </td>
                        <td style={{ color: 'var(--clay-text-muted)' }}>{formatCurrency(m.debtPayment)}</td>
                        <td className="font-semibold" style={{ color: m.surplus >= 0 ? 'var(--clay-text)' : 'var(--clay-red)' }}>{formatCurrency(m.surplus)}</td>
                        <td>{formatCurrency(m.savings)}</td>
                        <td>{formatCurrency(m.investment)}</td>
                        <td>{formatCurrency(m.emergency)}</td>
                        <td className="font-semibold" style={{ color: m.available >= 0 ? 'var(--clay-text)' : 'var(--clay-red)' }}>{formatCurrency(m.available)}</td>
                        <td className="font-bold" style={{ color: m.accumulated >= 0 ? 'var(--clay-accent)' : 'var(--clay-red)' }}>{formatCurrency(m.accumulated)}</td>
                        <td style={{ color: 'var(--clay-text-muted)' }}>{formatCurrency(m.remainingDebt)}</td>
                        <td>
                          {m.overridden && (
                            <button onClick={() => resetMonth(m.index)} title="Volver al valor base" className="clay-btn px-2 py-1 text-xs">↺</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Por ciclo de corte */}
        {config.includeDebts && debtCycles.some(d => d.cycles.length > 0) && (
          <div className="clay-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #a08090, #906c80)', boxShadow: 'var(--clay-shadow-sm)' }}>
                <BanknotesIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold" style={{ color: 'var(--clay-text)' }}>Por ciclo de corte</h3>
                <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>
                  Interés generado y saldo de cada deuda, segmentado por ciclo (la cuota se asigna al mes de su vencimiento).
                </p>
              </div>
            </div>

            {byCycle.length > 0 && (
              <div className="overflow-x-auto">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--clay-text-muted)' }}>Consolidado por ciclo (todas las deudas)</p>
                <table className="clay-table w-full">
                  <thead><tr><th>Ciclo (vence)</th><th>Interés generado</th><th>Cuota total</th></tr></thead>
                  <tbody>
                    {byCycle.map((c, i) => (
                      <tr key={i}>
                        <td className="font-semibold text-xs" style={{ color: 'var(--clay-text-muted)' }}>{c.label}</td>
                        <td style={{ color: 'var(--clay-red)' }}>{formatCurrency(c.interest)}</td>
                        <td style={{ color: 'var(--clay-text)' }}>{formatCurrency(c.payment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {debtCycles.filter(d => d.cycles.length > 0).map((d, di) => (
              <div key={di}>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--clay-text)' }}>{d.name}</p>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="clay-table w-full">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th>Ciclo</th><th>Corte</th><th>Vence</th>
                        <th>Saldo inicial</th><th>Interés</th><th>Capital</th><th>Cuota</th><th>Saldo cierre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.cycles.map((c, ci) => (
                        <tr key={ci}>
                          <td className="font-semibold text-xs whitespace-nowrap" style={{ color: 'var(--clay-text-muted)' }}>{c.label}</td>
                          <td className="text-xs whitespace-nowrap" style={{ color: 'var(--clay-text-muted)' }}>{c.cutStart} – {c.cutEnd}</td>
                          <td className="text-xs whitespace-nowrap" style={{ color: 'var(--clay-text-muted)' }}>{c.dueDate}</td>
                          <td>{formatCurrency(c.openingBalance)}</td>
                          <td style={{ color: 'var(--clay-red)' }}>{formatCurrency(c.interest)}</td>
                          <td style={{ color: 'var(--clay-green)' }}>{formatCurrency(c.capital)}</td>
                          <td>{formatCurrency(c.payment)}</td>
                          <td className="font-bold">{formatCurrency(c.closingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Guardar */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content animate-scale-in max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b" style={{ borderColor: '#d4c4b4' }}>
              <h3 className="text-lg font-display font-bold" style={{ color: 'var(--clay-text)' }}>Guardar simulación</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="input-label">Nombre</label>
                <input type="text" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Ej: Plan 2026 con prima" className="input-field" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowSaveModal(false)} className="clay-btn px-4 py-2 text-sm">Cancelar</button>
                <button onClick={handleSave} className="clay-btn-primary px-4 py-2 text-sm">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cargar */}
      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="modal-content animate-scale-in max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#d4c4b4' }}>
              <h3 className="text-lg font-display font-bold" style={{ color: 'var(--clay-text)' }}>Mis simulaciones</h3>
            </div>
            <div className="p-5 max-h-96 overflow-y-auto">
              {savedList.length === 0 ? (
                <div className="text-center py-8"><p className="text-sm" style={{ color: 'var(--clay-text-muted)' }}>No hay simulaciones guardadas</p></div>
              ) : (
                <div className="space-y-2">
                  {savedList.map(sim => (
                    <div key={sim.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--clay-card)', border: '1px solid rgba(255,255,255,0.5)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--clay-text)' }}>{sim.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--clay-text-muted)' }}>{new Date(sim.updated_at).toLocaleDateString('es-CO')}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleLoad(sim)} className="clay-btn-primary px-3 py-1.5 text-xs font-semibold">Cargar</button>
                        <button onClick={() => handleDelete(sim.id, sim.name)} className="clay-btn-danger px-2 py-1.5 text-xs" title="Eliminar"><TrashIcon className="h-3.5 w-3.5" /></button>
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

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--clay-text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

function MoneyInput({ value, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--clay-text-muted)' }}>$</span>
      <input
        type="number"
        step="1"
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        className="clay-input w-full px-3 py-2.5 pl-7 text-sm font-semibold"
      />
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="clay-card-sm p-5">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--clay-text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: accent }}>{value}</p>
    </div>
  )
}
