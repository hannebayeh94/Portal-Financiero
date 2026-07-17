import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { colors, clay } from '../theme'
import { formatCurrency, getMonthName } from '../utils/formatters'

export default function Projections() {
  const [projections, setProjections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/projections').then(r => setProjections(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f0e8dc' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.dark[900] }}>Proyecciones</Text>
      {loading ? <Text style={{ textAlign: 'center', color: colors.clay.textMuted }}>Cargando...</Text> :
        projections.length === 0 ? (
          <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.clay.textMuted }}>Sin proyecciones</Text>
            <Text style={{ fontSize: 13, color: colors.clay.textMuted, marginTop: 4 }}>Crea proyecciones desde el portal web</Text>
          </ClayCard>
        ) : projections.map((p) => (
          <ClayCard key={p.id}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.dark[800] }}>{p.name}</Text>
            <Text style={{ fontSize: 12, color: colors.clay.textMuted, marginBottom: 6 }}>Escenario: {p.scenario}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
              <Text style={{ color: colors.dark[600] }}>Ingreso proyectado</Text>
              <Text style={{ fontWeight: '700', color: colors.success[500] }}>{formatCurrency(p.monthly_income_projection)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
              <Text style={{ color: colors.dark[600] }}>Gasto proyectado</Text>
              <Text style={{ fontWeight: '700', color: colors.danger[400] }}>{formatCurrency(p.monthly_expense_projection)}</Text>
            </View>
          </ClayCard>
        ))
      }
    </ScrollView>
  )
}
