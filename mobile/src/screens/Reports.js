import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { colors } from '../theme'
import { formatCurrency, getMonthName } from '../utils/formatters'

export default function Reports() {
  const [cashFlow, setCashFlow] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/cash-flow').then(r => setCashFlow(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f0e8dc' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.dark[900] }}>Reportes</Text>
      {loading ? <Text style={{ textAlign: 'center', color: colors.clay.textMuted }}>Cargando...</Text> : cashFlow && (
        <>
          <ClayCard>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Flujo de Caja</Text>
            <Text style={{ fontSize: 12, color: colors.clay.textMuted, marginBottom: 6 }}>{getMonthName(cashFlow.period.month)} {cashFlow.period.year}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: colors.dark[600] }}>Ingresos</Text><Text style={{ fontWeight: '700', color: colors.success[500] }}>{formatCurrency(cashFlow.income)}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: colors.dark[600] }}>Egresos</Text><Text style={{ fontWeight: '700', color: colors.danger[400] }}>{formatCurrency(cashFlow.expenses)}</Text></View>
            {cashFlow.four_per_thousand > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: colors.dark[600] }}>4×1000</Text><Text style={{ fontWeight: '700', color: colors.warning[500] }}>{formatCurrency(cashFlow.four_per_thousand)}</Text></View>
            )}
            <View style={{ borderTopWidth: 1, borderTopColor: '#e0d4c8', marginTop: 4, paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', color: colors.dark[700] }}>Neto</Text>
              <Text style={{ fontWeight: '800', color: cashFlow.net_flow >= 0 ? colors.success[500] : colors.danger[400] }}>{formatCurrency(cashFlow.net_flow)}</Text>
            </View>
          </ClayCard>
        </>
      )}
    </ScrollView>
  )
}
