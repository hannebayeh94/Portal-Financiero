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

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const currentYear = new Date().getFullYear()

export default function Expenses() {
  const now = new Date()
  const kb = useKeyboardHeight()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
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
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchExpenses() }, [selectedMonth, selectedYear])

  const resetForm = () => setFormData({
    amount: '', description: '', date: new Date().toISOString().split('T')[0],
    type: 'variable', recurring: false, recurrence_type: 'monthly', apply_four_per_thousand: false,
  })

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description) { dialog.alert('Error', 'Completa los campos requeridos'); return }
    try {
      editing ? await api.put(`/expenses/${editing.id}`, formData) : await api.post('/expenses', formData)
      setShowModal(false); setEditing(null); resetForm(); fetchExpenses()
    } catch (e) { dialog.alert('Error', 'Error al guardar egreso') }
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
    dialog.confirm({
      title: 'Eliminar egreso',
      message: '¿Seguro que quieres eliminar este egreso?',
      confirmLabel: 'Eliminar',
      destructive: true,
      onConfirm: async () => { await api.delete(`/expenses/${id}`); fetchExpenses() },
    })
  }

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
  const fourTotal = expenses.filter(e => e.apply_four_per_thousand).reduce((s, e) => s + parseFloat(e.four_per_thousand_amount || 0), 0)

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
          backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border,
          shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
        }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Egresos</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>
              {formatCurrency(total)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => { resetForm(); setEditing(null); setShowModal(true) }}
            style={{
              backgroundColor: colors.danger[400], borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12,
              shadowColor: clay.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 5,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ClayCard small style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <Ionicons name="calendar-outline" size={16} color={colors.dark[400]} />
              <Picker2 value={selectedMonth} onChange={setSelectedMonth}
                items={MONTHS.map((m, i) => ({ label: m.substring(0, 3), value: i + 1 }))} />
            </ClayCard>
            <ClayCard small style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <Ionicons name="calendar-outline" size={16} color={colors.dark[400]} />
              <Picker2 value={selectedYear} onChange={setSelectedYear}
                items={Array.from({ length: 5 }, (_, i) => ({ label: String(currentYear - 2 + i), value: currentYear - 2 + i }))} />
            </ClayCard>
          </View>

          {/* 4x1000 Summary */}
          {fourTotal > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4,
            }}>
              <Ionicons name="information-circle-outline" size={14} color={colors.warning[500]} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.warning[500] }}>
                4×1000 del mes: {formatCurrency(fourTotal)}
              </Text>
            </View>
          )}

          {/* Expense List */}
          {loading ? (
            <Text style={{ textAlign: 'center', color: clay.textMuted, marginTop: 40 }}>Cargando...</Text>
          ) : expenses.length === 0 ? (
            <ClayCard style={{ alignItems: 'center', paddingVertical: 40, marginTop: 8 }}>
              <Ionicons name="receipt-outline" size={40} color={colors.dark[300]} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: clay.textMuted, marginTop: 12 }}>Sin egresos</Text>
              <Text style={{ fontSize: 13, color: clay.textMuted, marginTop: 4 }}>Toca + Nuevo para agregar</Text>
            </ClayCard>
          ) : expenses.map((exp) => (
            <ClayCard key={exp.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 }}>
              <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: colors.danger[50], justifyContent: 'center', alignItems: 'center', marginRight: 12,
              }}>
                <Ionicons name="arrow-down" size={18} color={colors.danger[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: clay.text }}>{exp.description}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                  <Text style={{ fontSize: 11, color: clay.textMuted }}>{formatDateShort(exp.date)}</Text>
                  <Text style={{ fontSize: 11, color: clay.textMuted }}>•</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: exp.type === 'fixed' ? colors.primary[500] : colors.warning[500] }}>
                    {exp.type === 'fixed' ? 'Fijo' : 'Variable'}
                  </Text>
                  {exp.apply_four_per_thousand && (
                    <>
                      <Text style={{ fontSize: 11, color: clay.textMuted }}>•</Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.warning[500] }}>4×1000</Text>
                    </>
                  )}
                </View>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.danger[400], marginRight: 8, letterSpacing: -0.5 }}>
                {formatCurrency(exp.amount)}
              </Text>
              <TouchableOpacity onPress={() => handleEdit(exp)} style={{ padding: 6 }}>
                <Ionicons name="create-outline" size={18} color={colors.dark[400]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(exp.id)} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger[400]} />
              </TouchableOpacity>
            </ClayCard>
          ))}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(20,23,38,0.55)', justifyContent: 'flex-end', paddingBottom: kb }}>
          <View style={{
            backgroundColor: clay.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%',
            shadowColor: clay.shadow, shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
          }}>
            <ScrollView style={{ gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text, letterSpacing: -0.3 }}>
                  {editing ? 'Editar Egreso' : 'Nuevo Egreso'}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={colors.dark[400]} />
                </TouchableOpacity>
              </View>

              <ClayInput label="Monto" value={formData.amount} onChangeText={(v) => setFormData({...formData, amount: v})} placeholder="0.00" keyboardType="decimal-pad" />
              <ClayToggle value={formData.apply_four_per_thousand} onValueChange={(v) => setFormData({...formData, apply_four_per_thousand: v})} label="Aplicar 4×1000 (GMF)" />
              {formData.apply_four_per_thousand && formData.amount && (
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.warning[500], marginTop: -8 }}>
                  Valor 4×1000: {formatCurrency(parseFloat(formData.amount) * 0.004)}
                </Text>
              )}
              <ClayInput label="Descripción" value={formData.description} onChangeText={(v) => setFormData({...formData, description: v})} placeholder="Ej: Arriendo" />
              <ClayDatePicker label="Fecha" value={formData.date} onChange={(v) => setFormData({...formData, date: v})} />

              <Text style={{ fontSize: 11, fontWeight: '800', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Tipo</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['fixed', 'variable'].map((t) => (
                  <TouchableOpacity key={t} onPress={() => setFormData({...formData, type: t})}
                    style={{
                      flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
                      backgroundColor: formData.type === t ? colors.danger[400] : clay.inset,
                      shadowColor: clay.shadow,
                      shadowOffset: formData.type === t ? { width: 2, height: 2 } : { width: 0, height: 2 },
                      shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
                    }}
                  >
                    <Text style={{ fontWeight: '800', fontSize: 13, color: formData.type === t ? '#fff' : clay.text }}>
                      {t === 'fixed' ? 'Fijo' : 'Variable'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ClayToggle value={formData.recurring} onValueChange={(v) => setFormData({...formData, recurring: v})} label="Egreso recurrente" />

              {formData.recurring && (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Frecuencia</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[{v: 'monthly', l: 'Mensual'}, {v: 'weekly', l: 'Semanal'}, {v: 'yearly', l: 'Anual'}].map((opt) => (
                      <TouchableOpacity key={opt.v} onPress={() => setFormData({...formData, recurrence_type: opt.v})}
                        style={{
                          flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center',
                          backgroundColor: formData.recurrence_type === opt.v ? colors.primary[500] : clay.inset,
                          shadowColor: clay.shadow,
                          shadowOffset: formData.recurrence_type === opt.v ? { width: 2, height: 2 } : { width: 0, height: 2 },
                          shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
                        }}
                      >
                        <Text style={{ fontWeight: '700', fontSize: 12, color: formData.recurrence_type === opt.v ? '#fff' : clay.text }}>{opt.l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 20 }}>
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
      <TouchableOpacity onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: clay.text }}>
          {items.find(i => i.value === value)?.label || value}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.dark[400]} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(45,52,54,0.6)', justifyContent: 'center', padding: 40 }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}
            style={{ backgroundColor: clay.card, borderRadius: 20, maxHeight: '70%', overflow: 'hidden', borderWidth: 1, borderColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 }}>
            <ScrollView>
              {items.map((item) => (
                <TouchableOpacity key={item.value} onPress={() => { onChange(item.value); setOpen(false) }}
                  style={{ paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: clay.border, backgroundColor: value === item.value ? clay.inset : 'transparent' }}>
                  <Text style={{ fontSize: 15, fontWeight: value === item.value ? '800' : '500', color: value === item.value ? colors.danger[400] : clay.text }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
