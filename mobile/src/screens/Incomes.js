import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import ClayInput from '../components/ClayInput'
import ClayToggle from '../components/ClayToggle'
import { colors } from '../theme'
import { formatCurrency, formatDateShort } from '../utils/formatters'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const currentYear = new Date().getFullYear()

export default function Incomes() {
  const now = new Date()
  const [incomes, setIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [formData, setFormData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0], source: 'salary', recurring: false, recurrence_type: 'monthly' })

  const fetch = async () => {
    try {
      const res = await api.get('/incomes', { params: { month: selectedMonth, year: selectedYear } })
      setIncomes(res.data)
    } catch (e) {} finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [selectedMonth, selectedYear])

  const resetForm = () => setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0], source: 'salary', recurring: false, recurrence_type: 'monthly' })

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description) { Alert.alert('Error', 'Completa los campos'); return }
    try {
      editing ? await api.put(`/incomes/${editing.id}`, formData) : await api.post('/incomes', formData)
      setShowModal(false); setEditing(null); resetForm(); fetch()
    } catch (e) { Alert.alert('Error', 'Error al guardar') }
  }

  const handleEdit = (inc) => {
    setEditing(inc)
    setFormData({ amount: String(inc.amount), description: inc.description, date: inc.date.split('T')[0], source: inc.source, recurring: inc.recurring, recurrence_type: inc.recurrence_type || 'monthly' })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    Alert.alert('Eliminar', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await api.delete(`/incomes/${id}`); fetch() } },
    ])
  }

  const total = incomes.reduce((s, i) => s + parseFloat(i.amount), 0)

  return (
    <View style={{ flex: 1, backgroundColor: '#f0e8dc' }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.dark[900] }}>Ingresos</Text>
          <TouchableOpacity onPress={() => { resetForm(); setEditing(null); setShowModal(true) }}
            style={{ backgroundColor: colors.success[400], borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, shadowColor: colors.clay.shadow, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        <ClayCard>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase' }}>Total Ingresos</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.success[500] }}>{formatCurrency(total)}</Text>
        </ClayCard>

        {loading ? <Text style={{ textAlign: 'center', color: colors.clay.textMuted, marginTop: 20 }}>Cargando...</Text> :
          incomes.map((inc) => (
            <ClayCard key={inc.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.dark[800] }}>{inc.description}</Text>
                <Text style={{ fontSize: 11, color: colors.clay.textMuted, marginTop: 2 }}>{formatDateShort(inc.date)}</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.success[500], marginRight: 8 }}>{formatCurrency(inc.amount)}</Text>
              <TouchableOpacity onPress={() => handleEdit(inc)} style={{ padding: 6 }}><Text style={{ fontSize: 16 }}>✎</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(inc.id)} style={{ padding: 6 }}><Text style={{ fontSize: 16, color: colors.danger[400] }}>✕</Text></TouchableOpacity>
            </ClayCard>
          ))
        }
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(45,52,54,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.clay.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <ScrollView style={{ gap: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.dark[900], marginBottom: 16 }}>{editing ? 'Editar Ingreso' : 'Nuevo Ingreso'}</Text>
              <ClayInput label="Monto" value={formData.amount} onChangeText={(v) => setFormData({...formData, amount: v})} placeholder="0.00" keyboardType="decimal-pad" />
              <ClayInput label="Descripción" value={formData.description} onChangeText={(v) => setFormData({...formData, description: v})} placeholder="Ej: Salario" />
              <ClayInput label="Fecha" value={formData.date} onChangeText={(v) => setFormData({...formData, date: v})} placeholder="YYYY-MM-DD" />
              <ClayToggle value={formData.recurring} onValueChange={(v) => setFormData({...formData, recurring: v})} label="Ingreso recurrente" />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
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
