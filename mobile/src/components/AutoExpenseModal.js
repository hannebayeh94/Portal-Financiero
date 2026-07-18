import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotifications } from '../context/NotificationContext'
import { dialog } from './ConfirmDialog'
import { clay, colors } from '../theme'
import { formatCurrency } from '../utils/formatters'
import api from '../api/client'

export default function AutoExpenseModal() {
  const { currentPayment, showPrompt, skipCurrent, removeCurrent } = useNotifications()
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState('detected') // 'detected' | 'associate'
  const [debts, setDebts] = useState([])
  const [selectedDebt, setSelectedDebt] = useState(null)
  const [assocType, setAssocType] = useState('payment') // 'payment' | 'charge'
  const insets = useSafeAreaInsets()

  if (!showPrompt || !currentPayment) return null

  const amount = parseFloat(currentPayment.amount) || 0
  const today = new Date().toISOString().split('T')[0]
  const isIncome = currentPayment.kind === 'income'
  const accent = isIncome ? colors.success[400] : colors.danger[400]

  const reset = () => { setMode('detected'); setSelectedDebt(null); setAssocType('payment') }

  const close = (fn) => { reset(); fn() }

  const handleRegister = async () => {
    setSaving(true)
    try {
      if (isIncome) {
        await api.post('/incomes', {
          amount, description: currentPayment.merchant, date: today,
          source: 'other', recurring: false, recurrence_type: 'monthly',
        })
      } else {
        await api.post('/expenses', {
          amount, description: currentPayment.merchant, date: today, type: 'variable',
          recurring: false, recurrence_type: 'monthly', apply_four_per_thousand: false,
        })
      }
      close(removeCurrent)
    } catch {
      dialog.alert('Error', isIncome ? 'No se pudo registrar el ingreso' : 'No se pudo registrar el egreso')
    } finally { setSaving(false) }
  }

  const openAssociate = async () => {
    setSaving(true)
    try {
      const r = await api.get('/debts', { params: { status: 'active' } })
      const list = r.data || []
      if (list.length === 0) {
        dialog.alert('Sin deudas', 'No tienes deudas activas para asociar este egreso.')
        return
      }
      setDebts(list)
      setSelectedDebt(list[0].id)
      setMode('associate')
    } catch {
      dialog.alert('Error', 'No se pudieron cargar las deudas')
    } finally { setSaving(false) }
  }

  const handleAssociate = async () => {
    if (!selectedDebt) return
    setSaving(true)
    try {
      if (assocType === 'payment') {
        await api.post(`/debts/${selectedDebt}/payments`, { amount, payment_date: today })
      } else {
        await api.post(`/debts/${selectedDebt}/charges`, { amount, payment_date: today, description: currentPayment.merchant })
      }
      close(removeCurrent)
    } catch {
      dialog.alert('Error', 'No se pudo asociar el egreso a la deuda')
    } finally { setSaving(false) }
  }

  const container = {
    position: 'absolute', bottom: 74 + insets.bottom, left: 16, right: 16,
    backgroundColor: clay.card, borderRadius: 24, padding: 20,
    shadowColor: clay.shadow, shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
    borderWidth: 1, borderColor: clay.border, zIndex: 1000,
  }

  if (mode === 'associate') {
    return (
      <View style={container}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setMode('detected')} style={{ padding: 2 }}>
            <Ionicons name="arrow-back" size={20} color={clay.textMuted} />
          </TouchableOpacity>
          <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text, flex: 1 }}>Asociar a deuda</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: accent }}>{formatCurrency(amount)}</Text>
        </View>

        <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
          {debts.map((d) => {
            const active = selectedDebt === d.id
            return (
              <TouchableOpacity key={d.id} onPress={() => setSelectedDebt(d.id)} activeOpacity={0.8}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8,
                  backgroundColor: active ? colors.primary[50] : clay.inset,
                  borderWidth: 1, borderColor: active ? colors.primary[400] : clay.border,
                }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: clay.text }}>{d.name}</Text>
                  <Text style={{ fontSize: 11, color: clay.textMuted }}>Saldo {formatCurrency(d.current_balance)}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 12 }}>
          {[{ v: 'payment', l: 'Abono (baja saldo)' }, { v: 'charge', l: 'Consumo (sube saldo)' }].map((o) => {
            const active = assocType === o.v
            return (
              <TouchableOpacity key={o.v} onPress={() => setAssocType(o.v)} activeOpacity={0.8}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                  backgroundColor: active ? colors.primary[500] : clay.inset,
                  borderWidth: 1, borderColor: active ? colors.primary[500] : clay.border,
                }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : clay.textMuted, textAlign: 'center' }}>{o.l}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity onPress={handleAssociate} disabled={saving} style={{
          borderRadius: 14, paddingVertical: 13, alignItems: 'center',
          backgroundColor: colors.primary[500], opacity: saving ? 0.6 : 1,
          shadowColor: clay.shadow, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
        }}>
          <Text style={{ fontWeight: '800', fontSize: 14, color: '#fff' }}>{saving ? 'Guardando…' : 'Asociar'}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: accent + '20', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={isIncome ? 'arrow-down-circle-outline' : 'receipt-outline'} size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: clay.textMuted }}>{isIncome ? 'Ingreso detectado' : 'Pago detectado'}</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: clay.text, marginTop: 1 }}>{currentPayment.merchant}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: accent }}>
          {isIncome ? '+' : ''}{formatCurrency(amount)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <TouchableOpacity onPress={skipCurrent} style={{
          flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: clay.inset,
          shadowColor: clay.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: clay.textMuted }}>Ignorar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={removeCurrent} style={{
          flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: clay.inset,
          shadowColor: clay.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: clay.textMuted }}>Descartar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRegister} disabled={saving} style={{
          flex: 1.5, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: accent, opacity: saving ? 0.6 : 1,
          shadowColor: clay.shadow, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
        }}>
          <Text style={{ fontWeight: '800', fontSize: 13, color: '#fff' }}>{saving ? 'Guardando…' : 'Registrar'}</Text>
        </TouchableOpacity>
      </View>

      {!isIncome && (
        <TouchableOpacity onPress={openAssociate} disabled={saving} style={{
          marginTop: 10, borderRadius: 14, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
          backgroundColor: colors.primary[50], borderWidth: 1, borderColor: colors.primary[100],
        }}>
          <Ionicons name="card-outline" size={16} color={colors.primary[600]} />
          <Text style={{ fontWeight: '800', fontSize: 13, color: colors.primary[600] }}>Asociar a una deuda</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
