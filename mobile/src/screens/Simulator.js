import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import { ClayLineChart, ClayBarChart } from '../components/ClayChart'
import { colors, clay, shadow } from '../theme'
import { formatCurrency } from '../utils/formatters'

const HORIZON_OPTIONS = [6, 12, 24, 36]
const ALLOC_ROWS = [
  { key: 'savings', label: 'Ahorro', color: '#22C55E' },
  { key: 'investment', label: 'Inversión', color: '#0EA5E9' },
  { key: 'emergency', label: 'Emergencias', color: '#F59E0B' },
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
  recurringIds: [],
  startingBalance: 0,
  includeDebts: true,
  debtThreshold: 0,
  allocations: { mode: 'percentage', savings: 10, investment: 5, emergency: 5 },
  overrides: {},
}

// Reduce el número de etiquetas del eje X para que no se solapen en pantallas pequeñas.
function sparseLabels(months) {
  const step = Math.max(1, Math.ceil(months.length / 6))
  return months.map((m, i) => (i % step === 0 ? m.label : ''))
}

export default function Simulator({ navigation }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)

  const [savedList, setSavedList] = useState([])
  const [saveModal, setSaveModal] = useState(false)
  const [loadModal, setLoadModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [currentId, setCurrentId] = useState(null)

  const [recurringExpenses, setRecurringExpenses] = useState([])

  const debounceRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      try {
        const year = new Date().getFullYear()
        const [evoRes, debtRes, recRes] = await Promise.all([
          api.get(`/reports/monthly-evolution?year=${year}`),
          api.get('/debts').catch(() => ({ data: [] })),
          api.get('/expenses/recurring').catch(() => ({ data: { items: [] } })),
        ])
        const recItems = recRes.data?.items || []
        setRecurringExpenses(recItems)
        const recurringTotal = recItems.reduce((s, i) => s + (i.monthlyAmount || 0), 0)
        const rows = evoRes.data?.data || []
        const withIncome = rows.filter(r => r.income > 0)
        const withExpense = rows.filter(r => r.expenses > 0)
        const avgIncome = withIncome.length ? Math.round(withIncome.reduce((s, r) => s + r.income, 0) / withIncome.length) : 0
        const avgExpense = withExpense.length ? Math.round(withExpense.reduce((s, r) => s + r.expenses, 0) / withExpense.length) : 0
        const activeDebts = (debtRes.data || []).filter(d => d.status === 'active')
        const totalDebt = activeDebts.reduce((s, d) => s + (parseFloat(d.current_balance) || 0), 0)
        setConfig(prev => ({ ...prev, baseIncome: avgIncome, recurringIds: recItems.map(i => i.id), baseExpense: recItems.length ? Math.max(0, avgExpense - recurringTotal) : avgExpense, debtThreshold: totalDebt ? Math.round(totalDebt * 1.5) : 0 }))
      } catch {}
      finally { setLoading(false) }
    })()
  }, [])

  const compute = useCallback(async (cfg) => {
    setComputing(true)
    try {
      const res = await api.post('/simulations/compute', { config: cfg })
      setResult(res.data)
    } catch {}
    finally { setComputing(false) }
  }, [])

  // Egresos recurrentes marcados (componente aparte del gasto base).
  const recurringIds = config.recurringIds || []
  const recurringSum = recurringExpenses
    .filter(i => recurringIds.includes(i.id))
    .reduce((s, i) => s + (i.monthlyAmount || 0), 0)
  // Gasto operativo total del mes = otros gastos (no recurrentes) + recurrentes marcados.
  const expenseBaseTotal = (parseFloat(config.baseExpense) || 0) + recurringSum

  useEffect(() => {
    if (loading) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const payload = { ...config, recurringExpense: recurringSum }
    debounceRef.current = setTimeout(() => compute(payload), 500)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [config, loading, compute, recurringSum])

  const setField = (field, value) => setConfig(prev => ({ ...prev, [field]: value }))
  const setAlloc = (key, value) => setConfig(prev => ({ ...prev, allocations: { ...prev.allocations, [key]: value } }))
  const setOverride = (idx, field, value) =>
    setConfig(prev => {
      const overrides = { ...prev.overrides }
      const entry = { ...(overrides[idx] || {}) }
      if (value === '' || value === null || value === undefined) delete entry[field]
      else entry[field] = parseFloat(value) || 0
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

  const toggleRecurring = (id) =>
    setConfig(prev => {
      const ids = new Set(prev.recurringIds || [])
      if (ids.has(id)) ids.delete(id)
      else ids.add(id)
      return { ...prev, recurringIds: Array.from(ids) }
    })

  const months = result?.months || []
  const alerts = result?.alerts || []
  const summary = result?.summary || {}
  const debtCycles = result?.debtCycles || []
  const byCycle = summary.byCycle || []

  const refetchSaved = async () => {
    try { const res = await api.get('/simulations'); setSavedList(res.data) } catch {}
  }
  const handleSave = async () => {
    if (!saveName.trim()) return
    try {
      const res = await api.post('/simulations', { name: saveName.trim(), config })
      setCurrentId(res.data.id); setSaveModal(false); setSaveName('')
    } catch {}
  }
  const handleUpdate = async () => {
    if (!currentId) { setSaveModal(true); return }
    try { await api.put(`/simulations/${currentId}`, { config }) } catch {}
  }
  const openLoad = async () => { await refetchSaved(); setLoadModal(true) }
  const handleLoad = (sim) => {
    setConfig({ ...DEFAULT_CONFIG, ...sim.config, allocations: { ...DEFAULT_CONFIG.allocations, ...(sim.config.allocations || {}) }, overrides: sim.config.overrides || {} })
    setCurrentId(sim.id); setLoadModal(false)
  }
  const handleDelete = async (id) => {
    try { await api.delete(`/simulations/${id}`); setSavedList(prev => prev.filter(s => s.id !== id)); if (currentId === id) setCurrentId(null) } catch {}
  }

  const labels = sparseLabels(months)

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, ...shadow.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Simulador</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={openLoad}><Ionicons name="folder-open-outline" size={22} color={colors.primary[500]} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setSaveModal(true)}><Ionicons name="save-outline" size={22} color={colors.primary[500]} /></TouchableOpacity>
          </View>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Flujo de caja a futuro</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {loading ? (
          <Text style={{ textAlign: 'center', color: clay.textMuted, marginTop: 40 }}>Cargando…</Text>
        ) : (
          <>
            {/* Configuración */}
            <ClayCard>
              <SectionTitle icon="settings-outline" title="Configuración" desc="Base pre-cargada de tus datos reales — editable" />
              <Label>Horizonte</Label>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {HORIZON_OPTIONS.map(m => (
                  <Chip key={m} active={config.horizonMonths === m} label={`${m}m`} onPress={() => setField('horizonMonths', m)} />
                ))}
              </View>
              <NumRow label="Mes inicial (AAAA-MM)" value={config.startMonth} onChange={(t) => setField('startMonth', t)} raw />
              <NumRow label="Ingreso base mensual" value={config.baseIncome} onChange={(v) => setField('baseIncome', v)} />
              <NumRow label="Otros gastos mensuales (no recurrentes)" value={config.baseExpense} onChange={(v) => setField('baseExpense', v)} />
              <NumRow label="Saldo inicial" value={config.startingBalance} onChange={(v) => setField('startingBalance', v)} />
              <NumRow label="Umbral de alerta de deuda" value={config.debtThreshold} onChange={(v) => setField('debtThreshold', v)} />
              <TouchableOpacity onPress={() => setField('includeDebts', !config.includeDebts)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: config.includeDebts ? colors.success[500] : clay.border, justifyContent: 'center' }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', position: 'absolute', top: 3, left: config.includeDebts ? 21 : 3, ...shadow.sm }} />
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: clay.text }}>Integrar mis deudas reales (cuotas e intereses)</Text>
              </TouchableOpacity>

              {recurringExpenses.length > 0 && (
                <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: clay.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: clay.text }}>Egresos recurrentes (gastos fijos)</Text>
                      <Text style={{ fontSize: 11, color: clay.textMuted, marginTop: 1 }}>Marca tus gastos fijos; se SUMAN a los "otros gastos" (semanal/anual se normalizan a mensual).</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>Recurrentes</Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.danger[400] }}>{formatCurrency(recurringSum)}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: clay.inset, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, color: clay.textMuted, flex: 1 }}>Gasto total = otros ({formatCurrency(config.baseExpense)}) + recurrentes</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: clay.text }}>{formatCurrency(expenseBaseTotal)}</Text>
                  </View>
                  {recurringExpenses.map(it => {
                    const checked = recurringIds.includes(it.id)
                    return (
                      <TouchableOpacity key={it.id} activeOpacity={0.7} onPress={() => toggleRecurring(it.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                        <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: checked ? colors.primary[500] : clay.border, backgroundColor: checked ? colors.primary[500] : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                          {checked && <Ionicons name="checkmark" size={15} color="#fff" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: clay.text }}>{it.description}</Text>
                          <Text style={{ fontSize: 11, color: clay.textMuted }}>
                            {formatCurrency(it.monthlyAmount)}/mes{it.recurrence_type !== 'monthly' ? ` · ${it.recurrence_type === 'weekly' ? 'semanal' : 'anual'}` : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </ClayCard>

            {/* Asignaciones */}
            <ClayCard>
              <SectionTitle icon="pie-chart-outline" title="Asignación automática" desc="Del excedente de cada mes" />
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <Chip active={config.allocations.mode === 'percentage'} label="Porcentaje %" onPress={() => setAlloc('mode', 'percentage')} />
                <Chip active={config.allocations.mode === 'fixed'} label="Valor fijo $" onPress={() => setAlloc('mode', 'fixed')} />
              </View>
              {ALLOC_ROWS.map(row => (
                <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: row.color }} />
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: clay.text }}>{row.label}</Text>
                  <TextInput
                    value={String(config.allocations[row.key] ?? '')}
                    onChangeText={(t) => setAlloc(row.key, parseFloat(t) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={clay.placeholder}
                    style={{ width: 120, backgroundColor: clay.surface, borderRadius: 12, borderWidth: 1, borderColor: clay.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '700', color: clay.text, textAlign: 'right' }}
                  />
                  <Text style={{ width: 14, color: clay.textMuted, fontWeight: '700' }}>{config.allocations.mode === 'percentage' ? '%' : '$'}</Text>
                </View>
              ))}
            </ClayCard>

            {/* Alertas */}
            {alerts.length > 0 && (
              <ClayCard style={{ borderLeftWidth: 4, borderLeftColor: colors.danger[500] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="warning-outline" size={20} color={colors.danger[500]} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>Alertas ({alerts.length})</Text>
                </View>
                {alerts.map((a, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, backgroundColor: a.type === 'debt' ? colors.warning[50] : colors.danger[50], borderRadius: 10, padding: 10, marginBottom: 6 }}>
                    <Ionicons name={a.type === 'debt' ? 'card-outline' : 'trending-down-outline'} size={16} color={a.type === 'debt' ? colors.warning[500] : colors.danger[500]} style={{ marginTop: 1 }} />
                    <Text style={{ flex: 1, fontSize: 13, color: clay.text }}>{a.message}</Text>
                  </View>
                ))}
              </ClayCard>
            )}

            {/* Resumen */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <StatCard label="Disponible acum." value={formatCurrency(summary.endBalance || 0)} color={(summary.endBalance || 0) >= 0 ? colors.primary[600] : colors.danger[500]} />
              <StatCard label="Apartado acum." value={formatCurrency(summary.savedEndBalance || 0)} color={colors.success[500]} />
              <StatCard label="Saldo mínimo" value={formatCurrency(summary.minBalance || 0)} color={(summary.minBalance || 0) >= 0 ? colors.success[500] : colors.danger[500]} />
              <StatCard label="Intereses deuda" value={formatCurrency(summary.totalDebtInterest || 0)} color={clay.text} />
            </View>

            {/* Gráficos */}
            {months.length > 0 && (
              <>
                <ClayCard>
                  <ClayLineChart
                    title="Saldo disponible y acumulado"
                    labels={labels}
                    datasets={[
                      { data: months.map(m => m.accumulated), color: '#171A2B' },
                      { data: months.map(m => m.available), color: '#F59E0B' },
                    ]}
                    legend={['Acumulado', 'Disponible']}
                  />
                </ClayCard>
                <ClayCard>
                  <ClayBarChart
                    title="Saldo disponible por mes"
                    labels={labels}
                    data={months.map(m => m.available)}
                    accent={colors.primary[500]}
                  />
                </ClayCard>
              </>
            )}

            {/* Datos por mes (editable) */}
            <ClayCard>
              <SectionTitle icon="calendar-outline" title="Datos por mes (editable)" desc="Edita el ingreso o gasto de cualquier mes (ej: prima en noviembre)" />
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                <Text style={{ width: 60 }} />
                <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: colors.success[500] }}>Ingreso</Text>
                <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: colors.danger[500] }}>Gasto (op.)</Text>
                <View style={{ width: 28 }} />
              </View>
              {months.map((m) => {
                const ov = config.overrides[m.index] || {}
                const incomeVal = ov.income ?? config.baseIncome
                const expenseVal = ov.expense ?? expenseBaseTotal
                return (
                  <View key={m.index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text style={{ width: 60, fontSize: 12, fontWeight: '700', color: m.overridden ? colors.primary[500] : clay.textMuted }}>{m.label}</Text>
                    <SmallInput value={incomeVal} placeholder="0" onChange={(t) => setOverride(m.index, 'income', t)} />
                    <SmallInput value={expenseVal} placeholder="0" onChange={(t) => setOverride(m.index, 'expense', t)} />
                    <TouchableOpacity onPress={() => resetMonth(m.index)} disabled={!m.overridden} style={{ width: 28, alignItems: 'center', opacity: m.overridden ? 1 : 0.25 }}>
                      <Ionicons name="refresh-outline" size={18} color={clay.textMuted} />
                    </TouchableOpacity>
                  </View>
                )
              })}
            </ClayCard>

            {/* Tabla detallada */}
            {months.length > 0 && (
              <ClayCard style={{ padding: 0, overflow: 'hidden' }}>
                <View style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>Detalle mensual</Text>
                  {computing && <Text style={{ fontSize: 12, color: clay.textMuted }}>Calculando…</Text>}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View>
                    <TableRow header cells={['Mes', 'Ingreso', 'Gasto', 'Cuota', 'Exced.', 'Ahorro', 'Inv.', 'Emerg.', 'Disp.', 'Acum.', 'Deuda']} />
                    {months.map((m) => (
                      <TableRow
                        key={m.index}
                        cells={[
                          m.label,
                          formatCurrency(m.income),
                          formatCurrency(m.expense),
                          formatCurrency(m.debtPayment),
                          formatCurrency(m.surplus),
                          formatCurrency(m.savings),
                          formatCurrency(m.investment),
                          formatCurrency(m.emergency),
                          formatCurrency(m.available),
                          formatCurrency(m.accumulated),
                          formatCurrency(m.remainingDebt),
                        ]}
                        negativeCols={{ 4: m.surplus < 0, 8: m.available < 0, 9: m.accumulated < 0 }}
                      />
                    ))}
                  </View>
                </ScrollView>
              </ClayCard>
            )}

            {/* Por ciclo de corte */}
            {config.includeDebts && debtCycles.some(d => d.cycles.length > 0) && (
              <ClayCard style={{ padding: 0, overflow: 'hidden' }}>
                <View style={{ padding: 14 }}>
                  <SectionTitle icon="card-outline" title="Por ciclo de corte" desc="Interés y saldo de cada deuda, por ciclo (cuota asignada al mes de vencimiento)" />
                  {byCycle.map((c, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: i < byCycle.length - 1 ? 1 : 0, borderBottomColor: clay.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, width: 90 }}>{c.label}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: colors.danger[500], textAlign: 'right' }}>Interés {formatCurrency(c.interest)}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: clay.text, textAlign: 'right' }}>Cuota {formatCurrency(c.payment)}</Text>
                    </View>
                  ))}
                </View>
                {debtCycles.filter(d => d.cycles.length > 0).map((d, di) => (
                  <View key={di}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: clay.text, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 }}>{d.name}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator>
                      <View>
                        <CycleRow header cells={['Ciclo', 'Vence', 'Inicial', 'Interés', 'Capital', 'Cuota', 'Cierre']} />
                        {d.cycles.map((c, ci) => (
                          <CycleRow
                            key={ci}
                            cells={[
                              c.label,
                              c.dueDate,
                              formatCurrency(c.openingBalance),
                              formatCurrency(c.interest),
                              formatCurrency(c.capital),
                              formatCurrency(c.payment),
                              formatCurrency(c.closingBalance),
                            ]}
                            interestCol
                          />
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ))}
              </ClayCard>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal Guardar */}
      <Modal visible={saveModal} transparent animationType="fade" onRequestClose={() => setSaveModal(false)}>
        <View style={modalOverlay}>
          <ClayCard style={{ width: '86%' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: clay.text, marginBottom: 12 }}>Guardar simulación</Text>
            <TextInput
              value={saveName} onChangeText={setSaveName} placeholder="Ej: Plan 2026 con prima" placeholderTextColor={clay.placeholder} autoFocus
              style={{ backgroundColor: clay.surface, borderRadius: 12, borderWidth: 1, borderColor: clay.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: clay.text, marginBottom: 14 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ClayButton title="Cancelar" variant="secondary" small style={{ flex: 1 }} onPress={() => setSaveModal(false)} />
              <ClayButton title="Guardar" small style={{ flex: 1 }} onPress={handleSave} />
            </View>
          </ClayCard>
        </View>
      </Modal>

      {/* Modal Cargar */}
      <Modal visible={loadModal} transparent animationType="fade" onRequestClose={() => setLoadModal(false)}>
        <View style={modalOverlay}>
          <ClayCard style={{ width: '90%', maxHeight: '70%' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: clay.text, marginBottom: 12 }}>Mis simulaciones</Text>
            <ScrollView>
              {savedList.length === 0 ? (
                <Text style={{ color: clay.textMuted, textAlign: 'center', paddingVertical: 24 }}>No hay simulaciones guardadas</Text>
              ) : savedList.map(sim => (
                <View key={sim.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: clay.surface, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: clay.text }}>{sim.name}</Text>
                    <Text style={{ fontSize: 11, color: clay.textMuted }}>{new Date(sim.updated_at).toLocaleDateString('es-CO')}</Text>
                  </View>
                  <ClayButton title="Cargar" small onPress={() => handleLoad(sim)} />
                  <TouchableOpacity onPress={() => handleDelete(sim.id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <ClayButton title="Cerrar" variant="secondary" small style={{ marginTop: 8 }} onPress={() => setLoadModal(false)} />
          </ClayCard>
        </View>
      </Modal>
    </View>
  )
}

const modalOverlay = { flex: 1, backgroundColor: 'rgba(20,23,38,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }

function SectionTitle({ icon, title, desc }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={19} color={colors.primary[500]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>{title}</Text>
        {desc ? <Text style={{ fontSize: 11, color: clay.textMuted }}>{desc}</Text> : null}
      </View>
    </View>
  )
}

function Label({ children }) {
  return <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, marginBottom: 7, marginLeft: 2 }}>{children}</Text>
}

function Chip({ active, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, backgroundColor: active ? colors.primary[500] : clay.surface, borderWidth: 1, borderColor: active ? colors.primary[500] : clay.border }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : clay.textMuted }}>{label}</Text>
    </TouchableOpacity>
  )
}

// Fila de entrada: modo dinero (numérico con parse) o texto crudo (raw).
function NumRow({ label, value, onChange, raw }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Label>{label}</Label>
      <TextInput
        value={raw ? String(value ?? '') : String(value ?? '')}
        onChangeText={(t) => onChange(raw ? t : (parseFloat(t) || 0))}
        keyboardType={raw ? 'default' : 'numeric'}
        placeholder={raw ? 'AAAA-MM' : '0'}
        placeholderTextColor={clay.placeholder}
        style={{ backgroundColor: clay.surface, borderRadius: 14, borderWidth: 1, borderColor: clay.border, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, fontWeight: '600', color: clay.text }}
      />
    </View>
  )
}

function SmallInput({ value, placeholder, onChange }) {
  return (
    <TextInput
      value={value === undefined || value === null ? '' : String(value)}
      onChangeText={onChange}
      keyboardType="numeric"
      placeholder={placeholder}
      placeholderTextColor={clay.placeholder}
      style={{ flex: 1, backgroundColor: clay.surface, borderRadius: 10, borderWidth: 1, borderColor: clay.border, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontWeight: '600', color: clay.text }}
    />
  )
}

function StatCard({ label, value, color }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: '46%', backgroundColor: clay.card, borderRadius: 16, borderWidth: 1, borderColor: clay.border, padding: 14, ...shadow.sm }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color, marginTop: 3 }}>{value}</Text>
    </View>
  )
}

function CycleRow({ header, cells, interestCol }) {
  const widths = [96, 100, 104, 96, 96, 96, 104]
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: clay.border, backgroundColor: header ? clay.surface : clay.card }}>
      {cells.map((c, i) => (
        <Text
          key={i}
          numberOfLines={1}
          style={{
            width: widths[i], paddingHorizontal: 8, paddingVertical: 10,
            fontSize: header ? 11 : 12,
            fontWeight: header ? '800' : (i === 0 ? '700' : '600'),
            color: header ? clay.textMuted : (interestCol && i === 3 ? colors.danger[500] : (i === 0 ? clay.textMuted : clay.text)),
          }}
        >
          {c}
        </Text>
      ))}
    </View>
  )
}

function TableRow({ header, cells, negativeCols = {} }) {
  const widths = [64, 92, 92, 92, 92, 84, 84, 84, 92, 96, 96]
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: clay.border, backgroundColor: header ? clay.surface : clay.card }}>
      {cells.map((c, i) => (
        <Text
          key={i}
          numberOfLines={1}
          style={{
            width: widths[i], paddingHorizontal: 8, paddingVertical: 10,
            fontSize: header ? 11 : 12,
            fontWeight: header ? '800' : (i === 0 ? '700' : '600'),
            color: header ? clay.textMuted : (negativeCols[i] ? colors.danger[500] : (i === 0 ? clay.textMuted : clay.text)),
          }}
        >
          {c}
        </Text>
      ))}
    </View>
  )
}
