import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { clay, colors, shadow } from '../theme'
import { useNotifications } from '../context/NotificationContext'
import { formatCurrency } from '../utils/formatters'
import api from '../api/client'

function timeAgo(ts) {
  const n = parseInt(ts, 10)
  if (!n) return ''
  const diff = Date.now() - n
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

export default function PaymentsHistory({ navigation }) {
  const { pendingPayments, removeOne } = useNotifications()
  const [savingId, setSavingId] = useState(null)
  const [assocFor, setAssocFor] = useState(null)     // id del egreso en modo asociar
  const [debts, setDebts] = useState([])
  const [assocDebt, setAssocDebt] = useState(null)
  const [assocType, setAssocType] = useState('payment')

  const openAssociate = async (p) => {
    const id = p.id ?? p.detected_at
    try {
      const r = await api.get('/debts', { params: { status: 'active' } })
      const list = r.data || []
      if (list.length === 0) { Alert.alert('Sin deudas', 'No tienes deudas activas para asociar este egreso.'); return }
      setDebts(list)
      setAssocDebt(list[0].id)
      setAssocType('payment')
      setAssocFor(id)
    } catch { Alert.alert('Error', 'No se pudieron cargar las deudas') }
  }

  const associate = async (p) => {
    const id = p.id ?? p.detected_at
    const amount = parseFloat(p.amount) || 0
    const date = new Date().toISOString().split('T')[0]
    setSavingId(id)
    try {
      if (assocType === 'payment') {
        await api.post(`/debts/${assocDebt}/payments`, { amount, payment_date: date })
      } else {
        await api.post(`/debts/${assocDebt}/charges`, { amount, payment_date: date, description: p.merchant })
      }
      setAssocFor(null)
      await removeOne(id)
    } catch { Alert.alert('Error', 'No se pudo asociar el egreso a la deuda') }
    finally { setSavingId(null) }
  }

  const register = async (p) => {
    const id = p.id ?? p.detected_at
    const amount = parseFloat(p.amount) || 0
    const date = new Date().toISOString().split('T')[0]
    const isIncome = p.kind === 'income'
    setSavingId(id)
    try {
      if (isIncome) {
        await api.post('/incomes', {
          amount, description: p.merchant, date, source: 'other',
          recurring: false, recurrence_type: 'monthly',
        })
      } else {
        await api.post('/expenses', {
          amount, description: p.merchant, date, type: 'variable',
          recurring: false, recurrence_type: 'monthly', apply_four_per_thousand: false,
        })
      }
      await removeOne(id)
    } catch {
      Alert.alert('Error', isIncome ? 'No se pudo registrar el ingreso' : 'No se pudo registrar el egreso')
    } finally {
      setSavingId(null)
    }
  }

  const discard = (p) => {
    Alert.alert('Descartar', '¿Eliminar este pago detectado?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeOne(p.id ?? p.detected_at) },
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{
          width: 40, height: 40, borderRadius: 12, backgroundColor: clay.card,
          alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: clay.border, ...shadow.sm,
        }}>
          <Ionicons name="chevron-back" size={22} color={clay.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: clay.textMuted }}>Captura automática</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Pagos detectados</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}>
        {pendingPayments.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 80, gap: 10 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: clay.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: clay.border, ...shadow.sm }}>
              <Ionicons name="checkmark-done" size={30} color={colors.success[400]} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: clay.text }}>No hay pagos pendientes</Text>
            <Text style={{ fontSize: 12.5, color: clay.textMuted, textAlign: 'center', paddingHorizontal: 30 }}>
              Los pagos que detectemos por notificación y no registres al momento aparecerán aquí.
            </Text>
          </View>
        ) : (
          pendingPayments.map((p) => {
            const id = p.id ?? p.detected_at
            const isIncome = p.kind === 'income'
            const accent = isIncome ? colors.success[400] : colors.danger[400]
            const amount = parseFloat(p.amount) || 0
            return (
              <View key={id} style={{
                backgroundColor: clay.card, borderRadius: 18, padding: 14,
                borderWidth: 1, borderColor: clay.border, ...shadow.sm,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 42, height: 42, borderRadius: 13, backgroundColor: accent + '20',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={isIncome ? 'arrow-down-circle-outline' : 'receipt-outline'} size={21} color={accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted }}>
                      {isIncome ? 'Ingreso' : 'Egreso'} · {timeAgo(p.detected_at)}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text, marginTop: 1 }} numberOfLines={1}>{p.merchant}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: accent }}>
                    {isIncome ? '+' : ''}{formatCurrency(amount)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity onPress={() => discard(p)} style={{
                    flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: clay.inset,
                  }}>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: clay.textMuted }}>Descartar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => register(p)} disabled={savingId === id} style={{
                    flex: 1.6, borderRadius: 12, paddingVertical: 11, alignItems: 'center',
                    backgroundColor: accent, opacity: savingId === id ? 0.6 : 1,
                  }}>
                    {savingId === id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={{ fontWeight: '800', fontSize: 13, color: '#fff' }}>Registrar</Text>}
                  </TouchableOpacity>
                </View>

                {!isIncome && assocFor !== id && (
                  <TouchableOpacity onPress={() => openAssociate(p)} style={{
                    marginTop: 8, borderRadius: 12, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
                    backgroundColor: colors.primary[50], borderWidth: 1, borderColor: colors.primary[100],
                  }}>
                    <Ionicons name="card-outline" size={15} color={colors.primary[600]} />
                    <Text style={{ fontWeight: '800', fontSize: 12.5, color: colors.primary[600] }}>Asociar a una deuda</Text>
                  </TouchableOpacity>
                )}

                {!isIncome && assocFor === id && (
                  <View style={{ marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: clay.inset, borderWidth: 1, borderColor: clay.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, marginBottom: 8 }}>Elige la deuda</Text>
                    {debts.map((d) => {
                      const active = assocDebt === d.id
                      return (
                        <TouchableOpacity key={d.id} onPress={() => setAssocDebt(d.id)} activeOpacity={0.8}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 11, marginBottom: 6,
                            backgroundColor: active ? colors.primary[50] : clay.card, borderWidth: 1, borderColor: active ? colors.primary[400] : clay.border }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: clay.text }}>{d.name}</Text>
                            <Text style={{ fontSize: 11, color: clay.textMuted }}>Saldo {formatCurrency(d.current_balance)}</Text>
                          </View>
                          {active && <Ionicons name="checkmark-circle" size={18} color={colors.primary[500]} />}
                        </TouchableOpacity>
                      )
                    })}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 10 }}>
                      {[{ v: 'payment', l: 'Abono' }, { v: 'charge', l: 'Consumo' }].map((o) => {
                        const active = assocType === o.v
                        return (
                          <TouchableOpacity key={o.v} onPress={() => setAssocType(o.v)} activeOpacity={0.8}
                            style={{ flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center',
                              backgroundColor: active ? colors.primary[500] : clay.card, borderWidth: 1, borderColor: active ? colors.primary[500] : clay.border }}>
                            <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? '#fff' : clay.textMuted }}>{o.l}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => setAssocFor(null)} style={{ flex: 1, borderRadius: 11, paddingVertical: 10, alignItems: 'center', backgroundColor: clay.card, borderWidth: 1, borderColor: clay.border }}>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: clay.textMuted }}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => associate(p)} disabled={savingId === id} style={{ flex: 1.4, borderRadius: 11, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.primary[500], opacity: savingId === id ? 0.6 : 1 }}>
                        {savingId === id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontWeight: '800', fontSize: 13, color: '#fff' }}>Asociar</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}
