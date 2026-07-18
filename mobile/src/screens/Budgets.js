import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import ClayInput from '../components/ClayInput'
import CategoryPicker from '../components/CategoryPicker'
import { dialog } from '../components/ConfirmDialog'
import useKeyboardHeight from '../utils/useKeyboardHeight'
import { clay, colors } from '../theme'
import { formatCurrency } from '../utils/formatters'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const now = new Date()

export default function Budgets({ navigation }) {
  const kb = useKeyboardHeight()
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ category_id: null, amount: '' })

  const fetchBudgets = async () => {
    try {
      const res = await api.get('/budgets', { params: { month, year } })
      setBudgets(res.data.budgets || [])
    } catch (e) {} finally { setLoading(false) }
  }
  const fetchCategories = async () => {
    try { const res = await api.get('/categories', { params: { type: 'expense' } }); setCategories(res.data) }
    catch (e) {}
  }

  useEffect(() => { fetchBudgets() }, [month, year])
  useFocusEffect(useCallback(() => { fetchCategories() }, []))

  const usedIds = new Set(budgets.map(b => b.category_id))
  const available = categories.filter(c => !usedIds.has(c.id))

  const openNew = () => { setEditing(null); setForm({ category_id: available[0]?.id ?? null, amount: '' }); setShowModal(true) }
  const openEdit = (b) => { setEditing(b); setForm({ category_id: b.category_id, amount: String(b.amount) }); setShowModal(true) }

  const handleSave = async () => {
    if (!form.amount || form.category_id == null) { dialog.alert('Error', 'Elige categoría y monto'); return }
    try {
      if (editing) {
        await api.put(`/budgets/${editing.id}`, { amount: form.amount })
      } else {
        await api.post('/budgets', { category_id: form.category_id, amount: form.amount, month, year })
      }
      setShowModal(false); setEditing(null); fetchBudgets()
    } catch (e) {
      dialog.alert('Error', e.response?.data?.error || 'No se pudo guardar el presupuesto')
    }
  }

  const handleDelete = (b) => {
    dialog.confirm({
      title: 'Eliminar presupuesto',
      message: `¿Eliminar el presupuesto de "${b.category_name}"?`,
      confirmLabel: 'Eliminar', destructive: true,
      onConfirm: async () => { try { await api.delete(`/budgets/${b.id}`); fetchBudgets() } catch { dialog.alert('Error', 'No se pudo eliminar') } },
    })
  }

  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0)
  const totalSpent = budgets.reduce((s, b) => s + parseFloat(b.spent || 0), 0)

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
              </TouchableOpacity>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Presupuestos</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>{formatCurrency(totalSpent)}<Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}> / {formatCurrency(totalBudget)}</Text></Text>
              </View>
            </View>
            <TouchableOpacity onPress={openNew} disabled={available.length === 0}
              style={{ backgroundColor: available.length === 0 ? clay.inset : colors.primary[500], borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="add" size={20} color={available.length === 0 ? clay.textMuted : '#fff'} />
              <Text style={{ color: available.length === 0 ? clay.textMuted : '#fff', fontWeight: '800', fontSize: 14 }}>Nuevo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month/Year selector */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14 }}>
          <ClayCard small style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
            <Ionicons name="calendar-outline" size={16} color={colors.dark[400]} />
            <Picker value={month} onChange={setMonth} items={MONTHS.map((m, i) => ({ label: m.substring(0, 3), value: i + 1 }))} />
          </ClayCard>
          <ClayCard small style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
            <Ionicons name="calendar-outline" size={16} color={colors.dark[400]} />
            <Picker value={year} onChange={setYear} items={Array.from({ length: 5 }, (_, i) => ({ label: String(now.getFullYear() - 2 + i), value: now.getFullYear() - 2 + i }))} />
          </ClayCard>
        </View>

        <View style={{ padding: 16, gap: 10 }}>
          {loading ? (
            <Text style={{ textAlign: 'center', color: clay.textMuted, marginTop: 30 }}>Cargando...</Text>
          ) : budgets.length === 0 ? (
            <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="pie-chart-outline" size={40} color={colors.dark[300]} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: clay.textMuted, marginTop: 12 }}>Sin presupuestos</Text>
              <Text style={{ fontSize: 13, color: clay.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
                {categories.length === 0 ? 'Primero crea categorías de egreso.' : 'Toca + Nuevo para poner un límite por categoría.'}
              </Text>
            </ClayCard>
          ) : budgets.map((b) => {
            const pct = Math.min(100, b.pct)
            const barColor = b.over_budget ? colors.danger[500] : b.pct >= 80 ? colors.warning[500] : colors.success[500]
            return (
              <ClayCard key={b.id} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: b.category_color || colors.dark[300], marginRight: 8 }} />
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: clay.text }}>{b.category_name || 'Sin categoría'}</Text>
                  {b.over_budget && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.danger[50], borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, marginRight: 6 }}>
                      <Ionicons name="warning-outline" size={12} color={colors.danger[500]} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.danger[500] }}>Sobregiro</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => openEdit(b)} style={{ padding: 4 }}><Ionicons name="create-outline" size={17} color={colors.primary[500]} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(b)} style={{ padding: 4 }}><Ionicons name="trash-outline" size={17} color={colors.danger[400]} /></TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: clay.textMuted }}>{formatCurrency(b.spent)} de {formatCurrency(b.amount)}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: b.over_budget ? colors.danger[500] : clay.text }}>{b.pct}%</Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: clay.inset, overflow: 'hidden' }}>
                  <View style={{ height: '100%', borderRadius: 4, width: `${pct}%`, backgroundColor: barColor }} />
                </View>
                <Text style={{ fontSize: 11, marginTop: 6, color: b.remaining < 0 ? colors.danger[500] : clay.textMuted, fontWeight: b.remaining < 0 ? '700' : '400' }}>
                  {b.remaining >= 0 ? `Disponible: ${formatCurrency(b.remaining)}` : `Excedido: ${formatCurrency(Math.abs(b.remaining))}`}
                </Text>
              </ClayCard>
            )
          })}
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(20,23,38,0.55)', justifyContent: 'flex-end', paddingBottom: kb }}>
          <View style={{ backgroundColor: clay.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%', shadowColor: clay.shadow, shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text }}>{editing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={colors.dark[400]} /></TouchableOpacity>
              </View>
              <View style={{ gap: 16 }}>
                {!editing && (
                  <CategoryPicker label="Categoría" categories={available} value={form.category_id} onChange={(v) => setForm({ ...form, category_id: v })} allowNone={false} />
                )}
                {editing && (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: clay.text }}>{editing.category_name}</Text>
                )}
                <ClayInput label="Monto mensual" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} placeholder="0" keyboardType="decimal-pad" />
                <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: -4 }}>Periodo: {MONTHS[month - 1]} {year}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 }}>
                  <ClayButton title="Cancelar" variant="secondary" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
                  <ClayButton title={editing ? 'Actualizar' : 'Guardar'} onPress={handleSave} style={{ flex: 1 }} />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function Picker({ value, onChange, items }) {
  const [open, setOpen] = useState(false)
  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: clay.text }}>{items.find(i => i.value === value)?.label || value}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.dark[400]} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(20,23,38,0.55)', justifyContent: 'center', padding: 40 }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: clay.card, borderRadius: 20, maxHeight: '70%', overflow: 'hidden', borderWidth: 1, borderColor: clay.border }}>
            <ScrollView>
              {items.map((item) => (
                <TouchableOpacity key={item.value} onPress={() => { onChange(item.value); setOpen(false) }}
                  style={{ paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: clay.border, backgroundColor: value === item.value ? clay.inset : 'transparent' }}>
                  <Text style={{ fontSize: 15, fontWeight: value === item.value ? '800' : '500', color: value === item.value ? colors.primary[500] : clay.text }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
