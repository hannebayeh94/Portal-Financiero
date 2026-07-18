import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { clay, colors } from '../theme'
import { formatCurrency } from '../utils/formatters'

export default function Debts({ navigation }) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/debts').then(r => setDebts(r.data)).catch(() => {}).finally(() => setLoading(false)) }, [])

  const deleteDebt = (id, name) => {
    Alert.alert('Eliminar', `¿Eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await api.delete(`/debts/${id}`); setDebts(d => d.filter(x => x.id !== id)) } },
    ])
  }

  const total = debts.reduce((s, d) => s + parseFloat(d.current_balance || 0), 0)

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Deudas</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>{formatCurrency(total)}</Text>
        </View>
        <View style={{ padding: 16, gap: 10 }}>
          {loading ? <Text style={{ textAlign: 'center', color: clay.textMuted, marginTop: 20 }}>Cargando...</Text> :
            debts.length === 0 ? (
              <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="card-outline" size={40} color={colors.dark[300]} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: clay.textMuted, marginTop: 12 }}>Sin deudas</Text>
              </ClayCard>
            ) : debts.map((d) => (
              <ClayCard key={d.id} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: clay.text, flex: 1 }}>{d.name}</Text>
                  <TouchableOpacity onPress={() => deleteDebt(d.id, d.name)} style={{ padding: 4 }}><Ionicons name="trash-outline" size={18} color={colors.danger[400]} /></TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
                  <View><Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>Saldo</Text><Text style={{ fontSize: 15, fontWeight: '800', color: colors.danger[400] }}>{formatCurrency(d.current_balance)}</Text></View>
                  <View><Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>Mensual</Text><Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>{formatCurrency(d.monthly_payment)}</Text></View>
                  <View><Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>Tasa</Text><Text style={{ fontSize: 15, fontWeight: '800', color: colors.warning[500] }}>{d.interest_rate}%</Text></View>
                </View>
              </ClayCard>
            ))
          }
        </View>
      </ScrollView>
    </View>
  )
}
