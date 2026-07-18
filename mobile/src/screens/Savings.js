import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import ClayInput from '../components/ClayInput'
import ClayDatePicker from '../components/ClayDatePicker'
import { clay, colors } from '../theme'
import { formatCurrency } from '../utils/formatters'

const TYPES = [
  { v: 'standard', l: 'Estándar' },
  { v: 'goal', l: 'Meta' },
  { v: 'investment', l: 'Inversión' },
]

const emptyForm = () => ({
  name: '', bank: '', current_balance: '', goal_amount: '',
  interest_rate: '', type: 'standard', start_date: new Date().toISOString().split('T')[0],
})

export default function Savings({ navigation }) {
  const [savings, setSavings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(emptyForm())

  const fetchSavings = async () => {
    try {
      const res = await api.get('/savings')
      setSavings(res.data)
    } catch (e) {
    } finally { setLoading(false) }
  }

  useFocusEffect(useCallback(() => { fetchSavings() }, []))

  const openNew = () => { setEditing(null); setFormData(emptyForm()); setShowModal(true) }

  const openEdit = (a) => {
    setEditing(a)
    setFormData({
      name: a.name, bank: a.bank, current_balance: String(a.current_balance),
      goal_amount: a.goal_amount != null ? String(a.goal_amount) : '',
      interest_rate: a.interest_rate != null ? String(a.interest_rate) : '',
      type: a.type, start_date: (a.start_date || new Date().toISOString()).split('T')[0],
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.bank || formData.current_balance === '') {
      Alert.alert('Error', 'Completa nombre, banco y saldo'); return
    }
    const payload = {
      ...formData,
      current_balance: parseFloat(formData.current_balance) || 0,
      goal_amount: formData.goal_amount === '' ? null : parseFloat(formData.goal_amount),
      interest_rate: formData.interest_rate === '' ? 0 : parseFloat(formData.interest_rate),
    }
    try {
      editing ? await api.put(`/savings/${editing.id}`, payload) : await api.post('/savings', payload)
      setShowModal(false); setEditing(null); setFormData(emptyForm()); fetchSavings()
    } catch (e) { Alert.alert('Error', 'Error al guardar la cuenta') }
  }

  const handleDelete = (id, name) => {
    Alert.alert('Eliminar', `¿Eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.delete(`/savings/${id}`); fetchSavings() }
        catch (e) { Alert.alert('Error', 'Error al eliminar') }
      }},
    ])
  }

  const totalBalance = savings.reduce((s, a) => s + parseFloat(a.current_balance || 0), 0)

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
              </TouchableOpacity>
              <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Ahorros</Text>
            </View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>{formatCurrency(totalBalance)}</Text>
          </View>
          <TouchableOpacity onPress={openNew}
            style={{ backgroundColor: colors.success[400], borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Nueva</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16, gap: 10 }}>
          {loading ? <Text style={{ textAlign: 'center', color: clay.textMuted, marginTop: 20 }}>Cargando...</Text> :
            savings.length === 0 ? (
              <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="wallet-outline" size={40} color={colors.dark[300]} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: clay.textMuted, marginTop: 12 }}>Sin cuentas de ahorro</Text>
                <Text style={{ fontSize: 13, color: clay.textMuted, marginTop: 4 }}>Toca + Nueva para crear una</Text>
              </ClayCard>
            ) : savings.map((a) => {
              const progress = a.goal_amount ? Math.min(100, (parseFloat(a.current_balance) / parseFloat(a.goal_amount)) * 100) : null
              return (
                <TouchableOpacity key={a.id} activeOpacity={0.85} onPress={() => navigation.navigate('SavingsDetail', { id: a.id, name: a.name })}>
                  <ClayCard>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="wallet-outline" size={20} color={colors.success[400]} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: clay.text }}>{a.name}</Text>
                        <Text style={{ fontSize: 12, color: clay.textMuted }}>{a.bank} · {TYPES.find(t => t.v === a.type)?.l || a.type}</Text>
                      </View>
                      <TouchableOpacity onPress={() => openEdit(a)} style={{ padding: 6 }}>
                        <Ionicons name="create-outline" size={18} color={colors.dark[400]} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(a.id, a.name)} style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger[400]} />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.success[400], letterSpacing: -0.5 }}>{formatCurrency(a.current_balance)}</Text>
                      {parseFloat(a.interest_rate) > 0 && (
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.warning[500] }}>{a.interest_rate}% interés</Text>
                      )}
                    </View>
                    {progress !== null && (
                      <View style={{ marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 11, color: clay.textMuted }}>Meta: {formatCurrency(a.goal_amount)}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: clay.text }}>{Math.round(progress)}%</Text>
                        </View>
                        <View style={{ height: 8, borderRadius: 4, backgroundColor: clay.inset, overflow: 'hidden' }}>
                          <View style={{ height: 8, borderRadius: 4, width: `${progress}%`, backgroundColor: colors.success[400] }} />
                        </View>
                      </View>
                    )}
                  </ClayCard>
                </TouchableOpacity>
              )
            })
          }
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(45,52,54,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: clay.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%', shadowColor: clay.shadow, shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 }}>
            <ScrollView>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text, letterSpacing: -0.3 }}>{editing ? 'Editar Cuenta' : 'Nueva Cuenta'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={colors.dark[400]} /></TouchableOpacity>
              </View>

              <View style={{ gap: 14 }}>
                <ClayInput label="Nombre" value={formData.name} onChangeText={(v) => setFormData({ ...formData, name: v })} placeholder="Ej: Ahorro vacaciones" />
                <ClayInput label="Banco" value={formData.bank} onChangeText={(v) => setFormData({ ...formData, bank: v })} placeholder="Ej: Bancolombia" />
                <ClayInput label={editing ? 'Saldo Actual' : 'Saldo Inicial'} value={formData.current_balance} onChangeText={(v) => setFormData({ ...formData, current_balance: v })} placeholder="0" keyboardType="decimal-pad" />
                <ClayInput label="Meta (opcional)" value={formData.goal_amount} onChangeText={(v) => setFormData({ ...formData, goal_amount: v })} placeholder="0" keyboardType="decimal-pad" />
                <ClayInput label="Tasa de Interés (%)" value={formData.interest_rate} onChangeText={(v) => setFormData({ ...formData, interest_rate: v })} placeholder="0" keyboardType="decimal-pad" />

                <View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Tipo</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {TYPES.map((t) => (
                      <TouchableOpacity key={t.v} onPress={() => setFormData({ ...formData, type: t.v })}
                        style={{ flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: formData.type === t.v ? colors.success[400] : clay.inset, shadowColor: clay.shadow, shadowOffset: formData.type === t.v ? { width: 2, height: 2 } : { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2 }}>
                        <Text style={{ fontWeight: '800', fontSize: 12, color: formData.type === t.v ? '#fff' : clay.text }}>{t.l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {!editing && (
                  <ClayDatePicker label="Fecha de Inicio" value={formData.start_date} onChange={(v) => setFormData({ ...formData, start_date: v })} />
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 }}>
                <ClayButton title="Cancelar" variant="secondary" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
                <ClayButton title={editing ? 'Actualizar' : 'Guardar'} variant="success" onPress={handleSubmit} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
