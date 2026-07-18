import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { colors, clay } from '../theme'
import { formatCurrency, getMonthName } from '../utils/formatters'

export default function Projections({ navigation }) {
  const [projections, setProjections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/projections').then(r => setProjections(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Proyecciones</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Escenarios Financieros</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {loading ? <Text style={{ textAlign: 'center', color: clay.textMuted }}>Cargando...</Text> :
          projections.length === 0 ? (
            <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="eye-outline" size={40} color={colors.dark[300]} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: clay.textMuted, marginTop: 12 }}>Sin proyecciones</Text>
              <Text style={{ fontSize: 13, color: clay.textMuted, marginTop: 4 }}>Crea proyecciones desde el portal web</Text>
            </ClayCard>
          ) : projections.map((p) => (
            <ClayCard key={p.id}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.dark[800] }}>{p.name}</Text>
              <Text style={{ fontSize: 12, color: clay.textMuted, marginBottom: 6 }}>Escenario: {p.scenario}</Text>
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
    </View>
  )
}
