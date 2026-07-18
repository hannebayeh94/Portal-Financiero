import { useState } from 'react'
import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNotifications } from '../context/NotificationContext'
import ClayCard from './ClayCard'
import ClayButton from './ClayButton'
import ClayInput from './ClayInput'
import ClayToggle from './ClayToggle'
import { clay, colors } from '../theme'
import { formatCurrency } from '../utils/formatters'
import api from '../api/client'

export default function AutoExpenseModal() {
  const { currentPayment, showPrompt, dismissPayment, skipPayment } = useNotifications()
  const [saving, setSaving] = useState(false)

  if (!showPrompt || !currentPayment) return null

  const amount = parseFloat(currentPayment.amount) || 0
  const today = new Date().toISOString().split('T')[0]

  const handleRegister = async () => {
    setSaving(true)
    try {
      await api.post('/expenses', {
        amount,
        description: currentPayment.merchant,
        date: today,
        type: 'variable',
        recurring: false,
        recurrence_type: 'monthly',
        apply_four_per_thousand: false,
      })
      dismissPayment()
    } catch {
      Alert.alert('Error', 'No se pudo registrar el egreso')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{
      position: 'absolute', bottom: 100, left: 16, right: 16,
      backgroundColor: clay.card, borderRadius: 24, padding: 20,
      shadowColor: clay.shadow, shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
      borderWidth: 1, borderColor: clay.border, zIndex: 1000,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 14,
          backgroundColor: colors.danger[400] + '20',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Ionicons name="receipt-outline" size={20} color={colors.danger[400]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: clay.textMuted }}>Pago detectado</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: clay.text, marginTop: 1 }}>{currentPayment.merchant}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.danger[400] }}>
          {formatCurrency(amount)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <TouchableOpacity onPress={skipPayment} style={{
          flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
          backgroundColor: clay.inset,
          shadowColor: clay.shadow, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: clay.textMuted }}>Ignorar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={dismissPayment} style={{
          flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
          backgroundColor: clay.inset,
          shadowColor: clay.shadow, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: clay.textMuted }}>Descartar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRegister} style={{
          flex: 1.5, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
          backgroundColor: colors.danger[400],
          shadowColor: clay.shadow, shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
        }}>
          <Text style={{ fontWeight: '800', fontSize: 13, color: '#fff' }}>Registrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
