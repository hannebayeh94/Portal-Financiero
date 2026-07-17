import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { colors } from '../theme'
import { formatCurrency } from '../utils/formatters'

export default function Savings() {
  const [savings, setSavings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/savings').then(r => setSavings(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalBalance = savings.reduce((s, a) => s + parseFloat(a.current_balance || 0), 0)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f0e8dc' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.dark[900] }}>Ahorros</Text>
      <ClayCard>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase' }}>Balance Total</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.success[500] }}>{formatCurrency(totalBalance)}</Text>
      </ClayCard>
      {loading ? <Text style={{ textAlign: 'center', color: colors.clay.textMuted }}>Cargando...</Text> :
        savings.map((a) => (
          <ClayCard key={a.id} style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.dark[800] }}>{a.name}</Text>
            <Text style={{ fontSize: 12, color: colors.clay.textMuted }}>{a.bank}</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.success[500], marginTop: 4 }}>{formatCurrency(a.current_balance)}</Text>
          </ClayCard>
        ))
      }
    </ScrollView>
  )
}
