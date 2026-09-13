import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import { ClayLineChart, ClayBarChart } from '../components/ClayChart'
import { colors, clay, shadow } from '../theme'
import { formatCurrency } from '../utils/formatters'

function defaultDueDate() {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 20)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const newRow = () => ({
  description: '',
  mode: 'total',
  totalAmount: '',
  totalInstallments: '',
  paidInstallments: '0',
  pendingCapital: '',
  remainingMonths: '',
  monthlyRate: '2.16',
})

export default function CreditCard({ navigation }) {
  const [method, setMethod] = useState('linear')
  const [firstDueDate, setFirstDueDate] = useState(defaultDueDate())
  const [rows, setRows] = useState([newRow()])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const updateRow = (i, field, value) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  const addRow = () => setRows((prev) => [...prev, newRow()])
  const removeRow = (i) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))

  const calculate = async () => {
    const purchases = rows
      .map((r) => {
        const base = { description: r.description || 'Compra', monthlyRate: parseFloat(r.monthlyRate) || 0 }
        if (r.mode === 'pending') {
          return { ...base, pendingCapital: parseFloat(r.pendingCapital) || 0, remainingMonths: parseInt(r.remainingMonths, 10) || 0 }
        }
        return {
          ...base,
          totalAmount: parseFloat(r.totalAmount) || 0,
          totalInstallments: parseInt(r.totalInstallments, 10) || 0,
          paidInstallments: parseInt(r.paidInstallments, 10) || 0,
        }
      })
      .filter((p) => p.pendingCapital > 0 || (p.totalAmount > 0 && p.totalInstallments > 0))

    if (!purchases.length) {
      Alert.alert('Falta información', 'Agrega al menos una compra con monto o saldo pendiente.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/credit-card/plan', { method, firstDueDate, purchases })
      setResult(res.data)
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error al calcular el plan')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setRows([newRow()])
    setResult(null)
  }

  const active = result?.results?.[method]
  const comparison = result?.comparison

  const months = active?.months || []
  const step = months.length ? Math.max(1, Math.ceil(months.length / 6)) : 1
  const labels = months.map((m, i) => (i % step === 0 ? m.label : ''))

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, ...shadow.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Tarjeta de crédito</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Compras a cuotas</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Método */}
        <ClayCard>
          <SectionTitle icon="card-outline" title="Método y fecha" desc="Cómo amortiza la tarjeta" />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Chip active={method === 'linear'} label="Capital fijo" onPress={() => setMethod('linear')} />
            <Chip active={method === 'annuity'} label="Cuota fija" onPress={() => setMethod('annuity')} />
          </View>
          <Text style={{ fontSize: 11, color: clay.textMuted, marginBottom: 12 }}>
            {method === 'linear'
              ? 'Capital fijo: monto ÷ cuotas cada mes + interés sobre el saldo (así factura RappiCard). Cuota decreciente.'
              : 'Cuota fija: pago igual cada mes (anualidad francesa).'}
          </Text>
          <Field label="Fecha del primer pago (AAAA-MM-DD)" value={firstDueDate} onChangeText={setFirstDueDate} keyboardType="default" placeholder="2026-10-20" />
        </ClayCard>

        {/* Compras */}
        {rows.map((row, i) => (
          <ClayCard key={i}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>Compra {i + 1}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => updateRow(i, 'mode', row.mode === 'total' ? 'pending' : 'total')}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary[500] }}>
                    {row.mode === 'total' ? 'Usar saldo pendiente' : 'Usar monto y cuotas'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeRow(i)} disabled={rows.length === 1} style={{ opacity: rows.length === 1 ? 0.3 : 1 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger[500]} />
                </TouchableOpacity>
              </View>
            </View>

            <Field label="Descripción" value={row.description} onChangeText={(t) => updateRow(i, 'description', t)} placeholder="Ej: Amazon" />
            {row.mode === 'total' ? (
              <>
                <Field label="Monto total" value={row.totalAmount} onChangeText={(t) => updateRow(i, 'totalAmount', t)} keyboardType="decimal-pad" placeholder="0" />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Field label="Cuotas" value={row.totalInstallments} onChangeText={(t) => updateRow(i, 'totalInstallments', t)} keyboardType="number-pad" placeholder="12" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Ya pagadas" value={row.paidInstallments} onChangeText={(t) => updateRow(i, 'paidInstallments', t)} keyboardType="number-pad" placeholder="0" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Tasa % M.V" value={row.monthlyRate} onChangeText={(t) => updateRow(i, 'monthlyRate', t)} keyboardType="decimal-pad" placeholder="2.16" />
                  </View>
                </View>
              </>
            ) : (
              <>
                <Field label="Capital pendiente" value={row.pendingCapital} onChangeText={(t) => updateRow(i, 'pendingCapital', t)} keyboardType="decimal-pad" placeholder="0" />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Field label="Meses restantes" value={row.remainingMonths} onChangeText={(t) => updateRow(i, 'remainingMonths', t)} keyboardType="number-pad" placeholder="6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Tasa % M.V" value={row.monthlyRate} onChangeText={(t) => updateRow(i, 'monthlyRate', t)} keyboardType="decimal-pad" placeholder="2.16" />
                  </View>
                </View>
              </>
            )}
          </ClayCard>
        ))}

        <ClayButton title="+ Agregar compra" variant="secondary" small onPress={addRow} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ClayButton title="Calcular plan" loading={loading} style={{ flex: 1 }} onPress={calculate} />
          <ClayButton title="Limpiar" variant="secondary" onPress={reset} />
        </View>

        {/* Resultados */}
        {!active ? null : (
          <>
            {/* Comparación */}
            {comparison && (
              <ClayCard>
                <SectionTitle icon="git-compare-outline" title="Comparación de métodos" desc="Total a pagar con cada método" />
                {['linear', 'annuity'].map((m) => (
                  <View key={m} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: m === 'annuity' ? 1 : 0, borderTopColor: clay.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: m === method ? colors.primary[500] : clay.text }}>
                        {m === 'linear' ? 'Capital fijo' : 'Cuota fija'}{m === method ? ' · elegido' : ''}
                      </Text>
                      {comparison.lowerInterest === m && (
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.success[500] }}>MENOS INTERESES</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, color: clay.textMuted }}>1er pago {formatCurrency(comparison[m].nextPayment)}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: clay.text }}>{formatCurrency(comparison[m].totalToPay)}</Text>
                      <Text style={{ fontSize: 11, color: colors.danger[500] }}>Intereses {formatCurrency(comparison[m].totalInterest)}</Text>
                    </View>
                  </View>
                ))}
              </ClayCard>
            )}

            {/* Resumen */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <StatCard label="Deuda pendiente" value={formatCurrency(active.summary.pendingCapital)} color={clay.text} />
              <StatCard label="Próximo pago" value={formatCurrency(active.summary.nextPayment)} color={colors.primary[500]} />
              <StatCard label="Total a pagar" value={formatCurrency(active.summary.totalToPay)} color={clay.text} />
              <StatCard label="Intereses totales" value={formatCurrency(active.summary.totalInterest)} color={colors.danger[500]} />
            </View>

            {/* Gráficos */}
            {months.length > 0 && (
              <>
                <ClayCard>
                  <ClayLineChart
                    title="Evolución del saldo"
                    labels={labels}
                    datasets={[{ data: months.map((m) => m.balance), color: '#1B8A8F' }]}
                    legend={['Saldo']}
                  />
                </ClayCard>
                <ClayCard>
                  <ClayBarChart
                    title="Cuota por mes"
                    labels={labels}
                    data={months.map((m) => m.payment)}
                    accent={colors.primary[500]}
                  />
                </ClayCard>
              </>
            )}

            {/* Tabla mes a mes */}
            <ClayCard style={{ padding: 0, overflow: 'hidden' }}>
              <View style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>Plan mes a mes</Text>
                <Text style={{ fontSize: 12, color: clay.textMuted }}>{active.summary.maxMonths} meses</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  <Row header cells={['Mes', 'Capital', 'Interés', 'Cuota', 'Saldo']} widths={[110, 96, 92, 100, 104]} />
                  {months.map((m) => (
                    <Row
                      key={m.month}
                      cells={[m.label, formatCurrency(m.capital), formatCurrency(m.interest), formatCurrency(m.payment), formatCurrency(m.balance)]}
                      widths={[110, 96, 92, 100, 104]}
                      dangerCol={2}
                    />
                  ))}
                </View>
              </ScrollView>
            </ClayCard>

            {/* Desglose por compra */}
            <ClayCard style={{ padding: 0, overflow: 'hidden' }}>
              <View style={{ padding: 14 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>Desglose por compra</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  <Row header cells={['Compra', 'Pendiente', 'Meses', 'Cap/mes', 'Tasa']} widths={[130, 104, 64, 100, 64]} />
                  {active.purchases.map((p, i) => (
                    <Row
                      key={i}
                      cells={[p.description, formatCurrency(p.pendingCapital), String(p.remaining), formatCurrency(p.perMonth), `${p.monthlyRatePct}%`]}
                      widths={[130, 104, 64, 100, 64]}
                    />
                  ))}
                </View>
              </ScrollView>
            </ClayCard>
          </>
        )}
      </ScrollView>
    </View>
  )
}

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

function Chip({ active, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: active ? colors.primary[500] : clay.surface, borderWidth: 1, borderColor: active ? colors.primary[500] : clay.border }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : clay.textMuted }}>{label}</Text>
    </TouchableOpacity>
  )
}

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, marginBottom: 6, marginLeft: 2 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={clay.placeholder}
        keyboardType={keyboardType}
        style={{ backgroundColor: clay.surface, borderRadius: 12, borderWidth: 1, borderColor: clay.border, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontWeight: '600', color: clay.text }}
      />
    </View>
  )
}

function StatCard({ label, value, color }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: '46%', backgroundColor: clay.card, borderRadius: 16, borderWidth: 1, borderColor: clay.border, padding: 14, ...shadow.sm }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color, marginTop: 3 }}>{value}</Text>
    </View>
  )
}

function Row({ header, cells, widths, dangerCol }) {
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
            color: header ? clay.textMuted : (dangerCol === i ? colors.danger[500] : (i === 0 ? clay.textMuted : clay.text)),
          }}
        >
          {c}
        </Text>
      ))}
    </View>
  )
}
