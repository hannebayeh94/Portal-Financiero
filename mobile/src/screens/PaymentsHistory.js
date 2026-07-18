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
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}
