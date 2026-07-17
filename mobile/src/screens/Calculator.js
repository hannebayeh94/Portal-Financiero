import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ClayCard from '../components/ClayCard'
import ClayInput from '../components/ClayInput'
import { colors, clay } from '../theme'
import { formatCurrency } from '../utils/formatters'

export default function Calculator({ navigation }) {
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('')
  const [months, setMonths] = useState('')

  const p = parseFloat(amount) || 0
  const r = (parseFloat(rate) || 0) / 100 / 12
  const n = parseInt(months) || 0
  const monthly = (r > 0 && n > 0) ? p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0
  const totalPayment = monthly * n
  const totalInterest = totalPayment - p

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.highlight, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Calculadora</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Simular Crédito</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <ClayCard>
        <Text style={{ fontSize: 13, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Simular Crédito</Text>
        <View style={{ gap: 14 }}>
          <ClayInput label="Monto del préstamo" value={amount} onChangeText={setAmount} placeholder="Ej: 10000000" keyboardType="decimal-pad" />
          <ClayInput label="Tasa de interés anual (%)" value={rate} onChangeText={setRate} placeholder="Ej: 18" keyboardType="decimal-pad" />
          <ClayInput label="Plazo (meses)" value={months} onChangeText={setMonths} placeholder="Ej: 12" keyboardType="number-pad" />
        </View>
      </ClayCard>
      {n > 0 && r > 0 && (
        <ClayCard>
          <Text style={{ fontSize: 13, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Resultados</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: colors.dark[600] }}>Cuota mensual</Text><Text style={{ fontWeight: '800', color: colors.primary[500] }}>{formatCurrency(monthly)}</Text></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: colors.dark[600] }}>Total a pagar</Text><Text style={{ fontWeight: '800', color: colors.danger[400] }}>{formatCurrency(totalPayment)}</Text></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: colors.dark[600] }}>Total intereses</Text><Text style={{ fontWeight: '800', color: colors.warning[500] }}>{formatCurrency(totalInterest)}</Text></View>
        </ClayCard>
      )}
    </ScrollView>
    </View>
  )
}
