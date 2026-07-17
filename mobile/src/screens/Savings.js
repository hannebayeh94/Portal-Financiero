import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { clay, colors } from '../theme'
import { formatCurrency } from '../utils/formatters'

export default function Savings() {
  const [savings, setSavings] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/savings').then(r => setSavings(r.data)).catch(() => {}).finally(() => setLoading(false)) }, [])
  const totalBalance = savings.reduce((s, a) => s + parseFloat(a.current_balance || 0), 0)

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.highlight, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Ahorros</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>{formatCurrency(totalBalance)}</Text>
        </View>
        <View style={{ padding: 16, gap: 10 }}>
          {loading ? <Text style={{ textAlign: 'center', color: clay.textMuted }}>Cargando...</Text> :
            savings.length === 0 ? (
              <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="wallet-outline" size={40} color={colors.dark[300]} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: clay.textMuted, marginTop: 12 }}>Sin cuentas de ahorro</Text>
              </ClayCard>
            ) : savings.map((a) => (
              <ClayCard key={a.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Ionicons name="wallet-outline" size={20} color={colors.success[400]} />
                  <View><Text style={{ fontSize: 16, fontWeight: '700', color: clay.text }}>{a.name}</Text><Text style={{ fontSize: 12, color: clay.textMuted }}>{a.bank}</Text></View>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.success[400], letterSpacing: -0.5 }}>{formatCurrency(a.current_balance)}</Text>
              </ClayCard>
            ))
          }
        </View>
      </ScrollView>
    </View>
  )
}
