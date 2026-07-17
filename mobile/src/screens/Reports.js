import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { clay, colors } from '../theme'
import { formatCurrency, getMonthName } from '../utils/formatters'

export default function Reports({ navigation }) {
  const [cashFlow, setCashFlow] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/reports/cash-flow').then(r => setCashFlow(r.data)).catch(() => {}).finally(() => setLoading(false)) }, [])

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.highlight, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Reportes</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Flujo de Caja</Text>
        </View>
        <View style={{ padding: 16, gap: 10 }}>
          {loading ? <Text style={{ textAlign: 'center', color: clay.textMuted }}>Cargando...</Text> : cashFlow && (
            <ClayCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Ionicons name="analytics-outline" size={18} color={colors.primary[500]} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {getMonthName(cashFlow.period.month)} {cashFlow.period.year}
                </Text>
              </View>
              {[
                { label: 'Ingresos', value: cashFlow.income, color: colors.success[400] },
                { label: 'Egresos', value: cashFlow.expenses, color: colors.danger[400] },
                ...(cashFlow.four_per_thousand > 0 ? [{ label: '4×1000', value: cashFlow.four_per_thousand, color: colors.warning[500] }] : []),
                { label: 'Deudas', value: cashFlow.debt_payments, color: colors.danger[500] },
                { label: 'Ahorros', value: cashFlow.savings_deposits, color: colors.success[500] },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: '#e0d4c8' }}>
                  <Text style={{ fontSize: 13, color: clay.text }}>{item.label}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: item.color }}>{formatCurrency(item.value)}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: clay.text }}>Neto</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: cashFlow.net_flow >= 0 ? colors.success[400] : colors.danger[400] }}>
                  {formatCurrency(cashFlow.net_flow)}
                </Text>
              </View>
            </ClayCard>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
