import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { ClayLineChart, ClayBarChart, ClayPieChart } from '../components/ClayChart'
import { clay, colors } from '../theme'
import { formatCurrency, getMonthName } from '../utils/formatters'

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const PIE_COLORS = ['#6D54E8', '#22C55E', '#F59E0B', '#0EA5E9', '#A855F7', '#F43F5E', '#16A34A', '#8A90A6']
const currentYear = new Date().getFullYear()

const TABS = [
  { key: 'flujo', label: 'Flujo' },
  { key: 'evolucion', label: 'Evolución' },
  { key: 'deudas', label: 'Deudas' },
  { key: 'ahorros', label: 'Ahorros' },
]

export default function Reports({ navigation }) {
  const [tab, setTab] = useState('flujo')
  const [year, setYear] = useState(currentYear)
  const [cashFlow, setCashFlow] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [debtStatus, setDebtStatus] = useState(null)
  const [savingsStatus, setSavingsStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/reports/cash-flow').then(r => setCashFlow(r.data)).catch(() => {}),
      api.get('/reports/monthly-evolution', { params: { year } }).then(r => setMonthly(r.data)).catch(() => {}),
      api.get('/reports/debt-status').then(r => setDebtStatus(r.data)).catch(() => {}),
      api.get('/reports/savings-status').then(r => setSavingsStatus(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [year])

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Reportes</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Análisis</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 12 }}>
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} activeOpacity={0.8}
              style={{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: active ? colors.primary[500] : clay.card, borderWidth: 1, borderColor: active ? colors.primary[500] : clay.border }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? '#fff' : clay.textMuted }}>{t.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {loading ? (
          <Text style={{ textAlign: 'center', color: clay.textMuted, marginTop: 30 }}>Cargando...</Text>
        ) : (
          <>
            {tab === 'flujo' && <FlujoTab cashFlow={cashFlow} />}
            {tab === 'evolucion' && <EvolucionTab monthly={monthly} year={year} setYear={setYear} />}
            {tab === 'deudas' && <DeudasTab debtStatus={debtStatus} />}
            {tab === 'ahorros' && <AhorrosTab savingsStatus={savingsStatus} />}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function Row({ label, value, color, bold }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: clay.border }}>
      <Text style={{ fontSize: 13, fontWeight: bold ? '800' : '500', color: bold ? clay.text : clay.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '800', color: color || clay.text }}>{value}</Text>
    </View>
  )
}

function FlujoTab({ cashFlow }) {
  if (!cashFlow) return <Empty text="Sin datos de flujo" />
  return (
    <ClayCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Ionicons name="analytics-outline" size={18} color={colors.primary[500]} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {getMonthName(cashFlow.period.month)} {cashFlow.period.year}
        </Text>
      </View>
      <Row label="Ingresos" value={formatCurrency(cashFlow.income)} color={colors.success[400]} />
      <Row label="Egresos" value={formatCurrency(cashFlow.expenses)} color={colors.danger[400]} />
      {cashFlow.four_per_thousand > 0 && <Row label="4×1000" value={formatCurrency(cashFlow.four_per_thousand)} color={colors.warning[500]} />}
      <Row label="Deudas (pagos)" value={formatCurrency(cashFlow.debt_payments)} color={colors.danger[500]} />
      <Row label="Ahorros (depósitos)" value={formatCurrency(cashFlow.savings_deposits)} color={colors.success[500]} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>Flujo neto</Text>
        <Text style={{ fontSize: 17, fontWeight: '800', color: cashFlow.net_flow >= 0 ? colors.success[400] : colors.danger[400] }}>{formatCurrency(cashFlow.net_flow)}</Text>
      </View>
    </ClayCard>
  )
}

function EvolucionTab({ monthly, year, setYear }) {
  const data = monthly?.data || []
  const hasData = data.some(m => m.income > 0 || m.expenses > 0)
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
          <TouchableOpacity key={y} onPress={() => setYear(y)}
            style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10, backgroundColor: year === y ? colors.primary[500] : clay.card, borderWidth: 1, borderColor: year === y ? colors.primary[500] : clay.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: year === y ? '#fff' : clay.textMuted }}>{y}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!hasData ? <Empty text={`Sin movimientos en ${year}`} /> : (
        <ClayCard>
          <ClayLineChart
            title="Ingresos vs Egresos"
            labels={data.map(m => MONTHS_SHORT[m.month - 1])}
            datasets={[
              { data: data.map(m => m.income), color: colors.success[500] },
              { data: data.map(m => m.expenses), color: colors.danger[500] },
            ]}
            legend={['Ingresos', 'Egresos']}
          />
        </ClayCard>
      )}
    </>
  )
}

function DeudasTab({ debtStatus }) {
  const debts = debtStatus?.debts || []
  if (debts.length === 0) return <Empty text="Sin deudas activas" />
  return (
    <>
      <ClayCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <View><Text style={{ fontSize: 11, color: clay.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>Total deuda</Text><Text style={{ fontSize: 18, fontWeight: '800', color: colors.danger[400] }}>{formatCurrency(debtStatus.total_debt)}</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: 11, color: clay.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>Pago mensual</Text><Text style={{ fontSize: 18, fontWeight: '800', color: colors.warning[500] }}>{formatCurrency(debtStatus.total_monthly_payment)}</Text></View>
        </View>
      </ClayCard>
      <ClayCard>
        <ClayBarChart
          title="Saldo por deuda"
          labels={debts.map(d => d.name.length > 6 ? d.name.substring(0, 6) + '…' : d.name)}
          data={debts.map(d => d.balance)}
          accent={colors.danger[400]}
        />
      </ClayCard>
      {debts.map((d) => (
        <ClayCard key={d.id} style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: clay.text }}>{d.name}</Text>
              <Text style={{ fontSize: 11, color: clay.textMuted }}>{d.bank} · {d.interest_rate}% · {d.remaining_months} meses</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.danger[400] }}>{formatCurrency(d.balance)}</Text>
          </View>
        </ClayCard>
      ))}
    </>
  )
}

function AhorrosTab({ savingsStatus }) {
  const accounts = (savingsStatus?.accounts || []).filter(a => a.balance > 0)
  if (accounts.length === 0) return <Empty text="Sin cuentas de ahorro" />
  return (
    <>
      <ClayCard>
        <Text style={{ fontSize: 11, color: clay.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>Saldo total</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.success[400] }}>{formatCurrency(savingsStatus.total_balance)}</Text>
        {savingsStatus.overall_progress != null && (
          <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: 2 }}>Progreso hacia metas: {savingsStatus.overall_progress}%</Text>
        )}
      </ClayCard>
      <ClayCard>
        <ClayPieChart
          title="Distribución de ahorros"
          slices={accounts.map((a, i) => ({ name: a.name, value: a.balance, color: PIE_COLORS[i % PIE_COLORS.length] }))}
        />
      </ClayCard>
      {accounts.map((a) => (
        <ClayCard key={a.id} style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: a.progress != null ? 8 : 0 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: clay.text }}>{a.name}</Text>
              <Text style={{ fontSize: 11, color: clay.textMuted }}>{a.bank}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.success[400] }}>{formatCurrency(a.balance)}</Text>
          </View>
          {a.progress != null && (
            <View style={{ height: 6, borderRadius: 3, backgroundColor: clay.inset, overflow: 'hidden' }}>
              <View style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, a.progress)}%`, backgroundColor: colors.success[400] }} />
            </View>
          )}
        </ClayCard>
      ))}
    </>
  )
}

function Empty({ text }) {
  return (
    <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Ionicons name="bar-chart-outline" size={40} color={colors.dark[300]} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: clay.textMuted, marginTop: 12 }}>{text}</Text>
    </ClayCard>
  )
}
