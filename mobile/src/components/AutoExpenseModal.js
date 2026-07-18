import { useState } from 'react'
import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotifications } from '../context/NotificationContext'
import ClayCard from './ClayCard'
import ClayButton from './ClayButton'
import ClayInput from './ClayInput'
import ClayToggle from './ClayToggle'
import { clay, colors } from '../theme'
import { formatCurrency } from '../utils/formatters'
import api from '../api/client'

export default function AutoExpenseModal() {
  const { currentPayment, showPrompt, skipCurrent, removeCurrent } = useNotifications()
  const [saving, setSaving] = useState(false)
  const insets = useSafeAreaInsets()

  if (!showPrompt || !currentPayment) return null

  const amount = parseFloat(currentPayment.amount) || 0
  const today = new Date().toISOString().split('T')[0]
  const isIncome = currentPayment.kind === 'income'
  const accent = isIncome ? colors.success[400] : colors.danger[400]

  const handleRegister = async () => {
    setSaving(true)
    try {
      if (isIncome) {
        await api.post('/incomes', {
          amount,
          description: currentPayment.merchant,
          date: today,
          source: 'other',
          recurring: false,
          recurrence_type: 'monthly',
        })
      } else {
        await api.post('/expenses', {
          amount,
          description: currentPayment.merchant,
          date: today,
          type: 'variable',
          recurring: false,
          recurrence_type: 'monthly',
          apply_four_per_thousand: false,
        })
      }
      removeCurrent()
    } catch {
      Alert.alert('Error', isIncome ? 'No se pudo registrar el ingreso' : 'No se pudo registrar el egreso')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{
      position: 'absolute', bottom: 74 + insets.bottom, left: 16, right: 16,
      backgroundColor: clay.card, borderRadius: 24, padding: 20,
      shadowColor: clay.shadow, shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
      borderWidth: 1, borderColor: clay.border, zIndex: 1000,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 14,
          backgroundColor: accent + '20',
          justifyContent: 'center', alignItems: 'center',
        }}>
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

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <TouchableOpacity onPress={skipCurrent} style={{
          flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
          backgroundColor: clay.inset,
          shadowColor: clay.shadow, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: clay.textMuted }}>Ignorar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={removeCurrent} style={{
          flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
          backgroundColor: clay.inset,
          shadowColor: clay.shadow, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: clay.textMuted }}>Descartar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRegister} disabled={saving} style={{
          flex: 1.5, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
          backgroundColor: accent, opacity: saving ? 0.6 : 1,
          shadowColor: clay.shadow, shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
        }}>
          <Text style={{ fontWeight: '800', fontSize: 13, color: '#fff' }}>{saving ? 'Guardando…' : 'Registrar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
