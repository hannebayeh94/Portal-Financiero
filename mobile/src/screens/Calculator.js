import { useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import ClayCard from '../components/ClayCard'
import ClayInput from '../components/ClayInput'
import { colors, clay } from '../theme'
import { formatCurrency } from '../utils/formatters'

export default function Calculator() {
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
    <ScrollView style={{ flex: 1, backgroundColor: '#f0e8dc' }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.dark[900] }}>Calculadora</Text>
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
  )
}
