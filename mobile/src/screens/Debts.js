import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import { colors } from '../theme'
import { formatCurrency } from '../utils/formatters'

export default function Debts() {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/debts').then(r => setDebts(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const deleteDebt = (id, name) => {
    Alert.alert('Eliminar', `¿Eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await api.delete(`/debts/${id}`); setDebts(d => d.filter(x => x.id !== id)) } },
    ])
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f0e8dc' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.dark[900] }}>Deudas</Text>
      {loading ? <Text style={{ textAlign: 'center', color: colors.clay.textMuted }}>Cargando...</Text> :
        debts.length === 0 ? (
          <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.clay.textMuted }}>Sin deudas registradas</Text>
          </ClayCard>
        ) : debts.map((d) => (
          <ClayCard key={d.id} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.dark[800], flex: 1 }}>{d.name}</Text>
              <TouchableOpacity onPress={() => deleteDebt(d.id, d.name)} style={{ padding: 4 }}><Text style={{ fontSize: 16, color: colors.danger[400] }}>✕</Text></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
              <View><Text style={{ fontSize: 11, color: colors.clay.textMuted }}>SALDO</Text><Text style={{ fontSize: 14, fontWeight: '800', color: colors.danger[400] }}>{formatCurrency(d.current_balance)}</Text></View>
              <View><Text style={{ fontSize: 11, color: colors.clay.textMuted }}>MENSUAL</Text><Text style={{ fontSize: 14, fontWeight: '800', color: colors.dark[700] }}>{formatCurrency(d.monthly_payment)}</Text></View>
              <View><Text style={{ fontSize: 11, color: colors.clay.textMuted }}>TASA</Text><Text style={{ fontSize: 14, fontWeight: '800', color: colors.dark[700] }}>{d.interest_rate}%</Text></View>
            </View>
          </ClayCard>
        ))
      }
    </ScrollView>
  )
}
