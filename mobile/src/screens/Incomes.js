import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import ClayInput from '../components/ClayInput'
import ClayToggle from '../components/ClayToggle'
import ClayDatePicker from '../components/ClayDatePicker'
import { dialog } from '../components/ConfirmDialog'
import useKeyboardHeight from '../utils/useKeyboardHeight'
import { clay, colors } from '../theme'
import { formatCurrency, formatDateShort } from '../utils/formatters'

export default function Incomes() {
  const now = new Date()
  const kb = useKeyboardHeight()
  const [incomes, setIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0], source: 'salary', recurring: false, recurrence_type: 'monthly' })

  const fetch = async () => {
    try { const res = await api.get('/incomes'); setIncomes(res.data) }
    catch (e) {} finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  const resetForm = () => setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0], source: 'salary', recurring: false, recurrence_type: 'monthly' })
  const handleSubmit = async () => {
    if (!formData.amount || !formData.description) { dialog.alert('Error', 'Completa los campos'); return }
    try {
      editing ? await api.put(`/incomes/${editing.id}`, formData) : await api.post('/incomes', formData)
      setShowModal(false); setEditing(null); resetForm(); fetch()
    } catch (e) { dialog.alert('Error', 'Error al guardar') }
  }
  const handleEdit = (inc) => {
    setEditing(inc)
    setFormData({ amount: String(inc.amount), description: inc.description, date: inc.date.split('T')[0], source: inc.source, recurring: inc.recurring, recurrence_type: inc.recurrence_type || 'monthly' })
    setShowModal(true)
  }
  const handleDelete = (id) => {
    dialog.confirm({
      title: 'Eliminar ingreso',
      message: '¿Seguro que quieres eliminar este ingreso?',
      confirmLabel: 'Eliminar',
      destructive: true,
      onConfirm: async () => { await api.delete(`/incomes/${id}`); fetch() },
    })
  }

  const total = incomes.reduce((s, i) => s + parseFloat(i.amount), 0)

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Ingresos</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>{formatCurrency(total)}</Text>
          </View>
          <TouchableOpacity onPress={() => { resetForm(); setEditing(null); setShowModal(true) }} style={{ backgroundColor: colors.success[400], borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16, gap: 10 }}>
          {loading ? <Text style={{ textAlign: 'center', color: clay.textMuted, marginTop: 20 }}>Cargando...</Text> :
            incomes.length === 0 ? (
              <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="cash-outline" size={40} color={colors.dark[300]} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: clay.textMuted, marginTop: 12 }}>Sin ingresos</Text>
              </ClayCard>
            ) : incomes.map((inc) => (
              <ClayCard key={inc.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.success[50], justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Ionicons name="arrow-up" size={18} color={colors.success[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: clay.text }}>{inc.description}</Text>
                  <Text style={{ fontSize: 11, color: clay.textMuted, marginTop: 2 }}>{formatDateShort(inc.date)}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.success[400], marginRight: 8 }}>{formatCurrency(inc.amount)}</Text>
                <TouchableOpacity onPress={() => handleEdit(inc)} style={{ padding: 6 }}><Ionicons name="create-outline" size={18} color={colors.dark[400]} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(inc.id)} style={{ padding: 6 }}><Ionicons name="trash-outline" size={18} color={colors.danger[400]} /></TouchableOpacity>
              </ClayCard>
            ))
          }
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(20,23,38,0.55)', justifyContent: 'flex-end', paddingBottom: kb }}>
          <View style={{ backgroundColor: clay.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%', shadowColor: clay.shadow, shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text }}>{editing ? 'Editar Ingreso' : 'Nuevo Ingreso'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={colors.dark[400]} /></TouchableOpacity>
              </View>
              <View style={{ gap: 16 }}>
                <ClayInput label="Monto" value={formData.amount} onChangeText={(v) => setFormData({...formData, amount: v})} placeholder="0.00" keyboardType="decimal-pad" />
                <ClayInput label="Descripción" value={formData.description} onChangeText={(v) => setFormData({...formData, description: v})} placeholder="Ej: Salario" />
                <ClayDatePicker label="Fecha" value={formData.date} onChange={(v) => setFormData({...formData, date: v})} />
                <ClayToggle value={formData.recurring} onValueChange={(v) => setFormData({...formData, recurring: v})} label="Ingreso recurrente" />
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 }}>
                  <ClayButton title="Cancelar" variant="secondary" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
                  <ClayButton title={editing ? 'Actualizar' : 'Guardar'} variant="success" onPress={handleSubmit} style={{ flex: 1 }} />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
