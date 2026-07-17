import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, RefreshControl, TextInput } from 'react-native'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import ClayInput from '../components/ClayInput'
import ClayToggle from '../components/ClayToggle'
import { colors } from '../theme'
import { formatCurrency, formatDateShort } from '../utils/formatters'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const currentYear = new Date().getFullYear()

export default function Expenses() {
  const now = new Date()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [formData, setFormData] = useState({
    amount: '', description: '', date: new Date().toISOString().split('T')[0],
    type: 'variable', recurring: false, recurrence_type: 'monthly', apply_four_per_thousand: false,
  })

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses', { params: { month: selectedMonth, year: selectedYear } })
      setExpenses(res.data)
    } catch (e) {
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchExpenses() }, [selectedMonth, selectedYear])

  const resetForm = () => setFormData({
    amount: '', description: '', date: new Date().toISOString().split('T')[0],
    type: 'variable', recurring: false, recurrence_type: 'monthly', apply_four_per_thousand: false,
  })

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description) {
      Alert.alert('Error', 'Completa todos los campos requeridos')
      return
    }
    try {
      if (editing) {
        await api.put(`/expenses/${editing.id}`, formData)
      } else {
        await api.post('/expenses', formData)
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      fetchExpenses()
    } catch (e) {
      Alert.alert('Error', 'Error al guardar egreso')
    }
  }

  const handleEdit = (exp) => {
    setEditing(exp)
    setFormData({
      amount: String(exp.amount), description: exp.description, date: exp.date.split('T')[0],
      type: exp.type, recurring: exp.recurring, recurrence_type: exp.recurrence_type || 'monthly',
      apply_four_per_thousand: exp.apply_four_per_thousand,
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    Alert.alert('Eliminar', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await api.delete(`/expenses/${id}`)
        fetchExpenses()
      }},
    ])
  }

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
  const fourTotal = expenses.filter(e => e.apply_four_per_thousand).reduce((s, e) => s + parseFloat(e.four_per_thousand_amount || 0), 0)

  return (
    <View style={{ flex: 1, backgroundColor: '#f0e8dc' }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses() }} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.dark[900] }}>Egresos</Text>
          <TouchableOpacity onPress={() => { resetForm(); setEditing(null); setShowModal(true) }}
            style={{ backgroundColor: colors.danger[400], borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, shadowColor: colors.clay.shadow, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ClayCard style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase' }}>Total</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.danger[400] }}>{formatCurrency(total)}</Text>
          </ClayCard>
          {fourTotal > 0 && (
            <ClayCard style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase' }}>4×1000</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.warning[500] }}>{formatCurrency(fourTotal)}</Text>
            </ClayCard>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          <View style={{ flex: 1, backgroundColor: '#e8ddd0', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, shadowColor: colors.clay.shadow, shadowOffset: { width: -4, height: -4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.clay.textMuted, marginBottom: 4 }}>MES</Text>
            <Picker2 value={selectedMonth} onChange={setSelectedMonth} items={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))} />
          </View>
          <View style={{ flex: 1, backgroundColor: '#e8ddd0', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, shadowColor: colors.clay.shadow, shadowOffset: { width: -4, height: -4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.clay.textMuted, marginBottom: 4 }}>AÑO</Text>
            <Picker2 value={selectedYear} onChange={setSelectedYear} items={Array.from({ length: 5 }, (_, i) => ({ label: String(currentYear - 2 + i), value: currentYear - 2 + i }))} />
          </View>
        </View>

        {loading ? (
          <Text style={{ textAlign: 'center', color: colors.clay.textMuted, marginTop: 40 }}>Cargando...</Text>
        ) : expenses.length === 0 ? (
          <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.clay.textMuted }}>No hay egresos</Text>
            <Text style={{ fontSize: 13, color: colors.clay.textMuted, marginTop: 4 }}>Comienza registrando tus egresos</Text>
          </ClayCard>
        ) : expenses.map((exp) => (
          <ClayCard key={exp.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.dark[800] }}>{exp.description}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                <Text style={{ fontSize: 11, color: colors.clay.textMuted }}>{formatDateShort(exp.date)}</Text>
                <Text style={{ fontSize: 11, color: colors.clay.textMuted }}>•</Text>
                <Text style={{ fontSize: 11, color: colors.clay.textMuted }}>
                  {exp.type === 'fixed' ? 'Fijo' : 'Variable'}
                </Text>
                {exp.apply_four_per_thousand && (
                  <>
                    <Text style={{ fontSize: 11, color: colors.clay.textMuted }}>•</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.warning[500] }}>
                      4×1000: {formatCurrency(exp.four_per_thousand_amount)}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.danger[400], marginRight: 8 }}>
              {formatCurrency(exp.amount)}
            </Text>
            <TouchableOpacity onPress={() => handleEdit(exp)} style={{ padding: 6 }}>
              <Text style={{ fontSize: 16 }}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(exp.id)} style={{ padding: 6 }}>
              <Text style={{ fontSize: 16, color: colors.danger[400] }}>✕</Text>
            </TouchableOpacity>
          </ClayCard>
        ))}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(45,52,54,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.clay.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
            <ScrollView style={{ gap: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.dark[900], marginBottom: 16 }}>
                {editing ? 'Editar Egreso' : 'Nuevo Egreso'}
              </Text>

              <ClayInput label="Monto" value={formData.amount} onChangeText={(v) => setFormData({...formData, amount: v})} placeholder="0.00" keyboardType="decimal-pad" />

              <ClayToggle value={formData.apply_four_per_thousand} onValueChange={(v) => setFormData({...formData, apply_four_per_thousand: v})} label="Aplicar 4×1000 (GMF)" />
              {formData.apply_four_per_thousand && formData.amount && (
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.warning[500], marginTop: -8 }}>
                  Valor 4×1000: {formatCurrency(parseFloat(formData.amount) * 0.004)}
                </Text>
              )}

              <ClayInput label="Descripción" value={formData.description} onChangeText={(v) => setFormData({...formData, description: v})} placeholder="Ej: Arriendo" />
              <ClayInput label="Fecha" value={formData.date} onChangeText={(v) => setFormData({...formData, date: v})} placeholder="YYYY-MM-DD" />

              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Tipo</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['fixed', 'variable'].map((t) => (
                    <TouchableOpacity key={t} onPress={() => setFormData({...formData, type: t})}
                      style={{ flex: 1, backgroundColor: formData.type === t ? colors.primary[400] : '#e8ddd0', borderRadius: 16, paddingVertical: 12, alignItems: 'center', shadowColor: colors.clay.shadow, shadowOffset: formData.type === t ? { width: 2, height: 2 } : { width: -3, height: -3 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 2 }}
                    >
                      <Text style={{ fontWeight: '700', fontSize: 13, color: formData.type === t ? '#fff' : colors.dark[600] }}>
                        {t === 'fixed' ? 'Fijo' : 'Variable'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <ClayToggle value={formData.recurring} onValueChange={(v) => setFormData({...formData, recurring: v})} label="Egreso recurrente" />

              {formData.recurring && (
                <View style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Frecuencia</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[{v: 'monthly', l: 'Mensual'}, {v: 'weekly', l: 'Semanal'}, {v: 'yearly', l: 'Anual'}].map((opt) => (
                      <TouchableOpacity key={opt.v} onPress={() => setFormData({...formData, recurrence_type: opt.v})}
                        style={{ flex: 1, backgroundColor: formData.recurrence_type === opt.v ? colors.primary[400] : '#e8ddd0', borderRadius: 16, paddingVertical: 10, alignItems: 'center', shadowColor: colors.clay.shadow, shadowOffset: formData.recurrence_type === opt.v ? { width: 2, height: 2 } : { width: -3, height: -3 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 2 }}
                      >
                        <Text style={{ fontWeight: '700', fontSize: 12, color: formData.recurrence_type === opt.v ? '#fff' : colors.dark[600] }}>{opt.l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <ClayButton title="Cancelar" variant="secondary" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
                <ClayButton title={editing ? 'Actualizar' : 'Guardar'} variant="danger" onPress={handleSubmit} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function Picker2({ value, onChange, items }) {
  const [open, setOpen] = useState(false)
  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(!open)}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.dark[700] }}>
          {items.find(i => i.value === value)?.label || value}
        </Text>
      </TouchableOpacity>
      {open && (
        <View style={{ position: 'absolute', top: 28, left: 0, right: 0, backgroundColor: colors.clay.card, borderRadius: 16, shadowColor: colors.clay.shadow, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 8, zIndex: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
          {items.map((item) => (
            <TouchableOpacity key={item.value} onPress={() => { onChange(item.value); setOpen(false) }}
              style={{ paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#e0d4c8' }}
            >
              <Text style={{ fontSize: 14, fontWeight: value === item.value ? '800' : '500', color: value === item.value ? colors.primary[600] : colors.dark[600] }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}
