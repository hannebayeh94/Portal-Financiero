import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayInput from '../components/ClayInput'
import ClayButton from '../components/ClayButton'
import ClayDatePicker from '../components/ClayDatePicker'
import { dialog } from '../components/ConfirmDialog'
import useKeyboardHeight from '../utils/useKeyboardHeight'
import { clay, colors } from '../theme'
import { formatCurrency } from '../utils/formatters'

const today = () => new Date().toISOString().split('T')[0]

const emptyForm = {
  name: '',
  bank_or_lender: '',
  total_amount: '',
  monthly_payment: '',
  interest_rate: '',
  interest_type: 'fixed',
  term_months: '',
  start_date: today(),
  end_date: '',
  payment_day: '',
  cut_day: '',
  status: 'active',
}

function Segmented({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <TouchableOpacity key={opt.value} onPress={() => onChange(opt.value)} activeOpacity={0.8}
            style={{
              flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
              backgroundColor: active ? colors.primary[500] : clay.surface,
              borderWidth: 1, borderColor: active ? colors.primary[500] : clay.border,
            }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : clay.textMuted }}>{opt.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default function Debts({ navigation }) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const insets = useSafeAreaInsets()
  const kb = useKeyboardHeight()

  const fetchDebts = () =>
    api.get('/debts').then(r => setDebts(r.data)).catch(() => {}).finally(() => setLoading(false))

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchDebts)
    return unsub
  }, [navigation])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalVisible(true)
  }

  const openEdit = (d) => {
    setEditing(d)
    setForm({
      name: d.name,
      bank_or_lender: d.bank_or_lender,
      total_amount: String(d.total_amount),
      monthly_payment: String(d.monthly_payment),
      interest_rate: String(d.interest_rate),
      interest_type: d.interest_type,
      term_months: String(d.term_months),
      remaining_months: String(d.remaining_months),
      start_date: (d.start_date || '').split('T')[0],
      end_date: (d.end_date || '').split('T')[0],
      payment_day: d.payment_day != null ? String(d.payment_day) : '',
      cut_day: d.cut_day != null ? String(d.cut_day) : '',
      status: d.status,
    })
    setModalVisible(true)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name || !form.bank_or_lender || !form.total_amount || !form.monthly_payment || !form.interest_rate || !form.term_months || !form.end_date) {
      dialog.alert('Campos incompletos', 'Completa todos los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/debts/${editing.id}`, form)
      } else {
        await api.post('/debts', form)
      }
      setModalVisible(false)
      fetchDebts()
    } catch {
      dialog.alert('Error', editing ? 'No se pudo actualizar la deuda' : 'No se pudo crear la deuda')
    } finally {
      setSaving(false)
    }
  }

  const deleteDebt = (id, name) => {
    dialog.confirm({
      title: 'Eliminar deuda',
      message: `¿Eliminar "${name}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
      onConfirm: async () => { await api.delete(`/debts/${id}`); setDebts(d => d.filter(x => x.id !== id)) },
    })
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

        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <ClayButton title="+ Nueva deuda" onPress={openCreate} />
        </View>

        <View style={{ padding: 16, gap: 10 }}>
          {loading ? <Text style={{ textAlign: 'center', color: clay.textMuted, marginTop: 20 }}>Cargando...</Text> :
            debts.length === 0 ? (
              <ClayCard style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="card-outline" size={40} color={colors.dark[300]} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: clay.textMuted, marginTop: 12 }}>Sin deudas</Text>
              </ClayCard>
            ) : debts.map((d) => {
              const paidPct = parseFloat(d.total_amount) > 0
                ? Math.round(((parseFloat(d.total_amount) - parseFloat(d.current_balance)) / parseFloat(d.total_amount)) * 100)
                : 0
              return (
              <TouchableOpacity key={d.id} activeOpacity={0.8} onPress={() => navigation.navigate('DebtDetail', { id: d.id })}>
                <ClayCard style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: clay.text }}>{d.name}</Text>
                      <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: 1 }}>{d.bank_or_lender}</Text>
                    </View>
                    <TouchableOpacity onPress={() => openEdit(d)} style={{ padding: 4 }}><Ionicons name="create-outline" size={18} color={colors.primary[500]} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteDebt(d.id, d.name)} style={{ padding: 4, marginLeft: 4 }}><Ionicons name="trash-outline" size={18} color={colors.danger[400]} /></TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
                    <View><Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>Saldo</Text><Text style={{ fontSize: 15, fontWeight: '800', color: colors.danger[400] }}>{formatCurrency(d.current_balance)}</Text></View>
                    <View><Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>Mensual</Text><Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>{formatCurrency(d.monthly_payment)}</Text></View>
                    <View><Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>Tasa</Text><Text style={{ fontSize: 15, fontWeight: '800', color: colors.warning[500] }}>{d.interest_rate}%</Text></View>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: clay.inset, overflow: 'hidden' }}>
                      <View style={{ width: `${Math.max(0, Math.min(100, paidPct))}%`, height: '100%', borderRadius: 3, backgroundColor: colors.primary[500] }} />
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, marginTop: 4 }}>{paidPct}% pagado</Text>
                  </View>
                </ClayCard>
              </TouchableOpacity>
              )
            })
          }
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(20,23,38,0.55)', justifyContent: 'flex-end', paddingBottom: kb }}>
          <View style={{ backgroundColor: clay.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20, paddingHorizontal: 20, paddingBottom: (kb > 0 ? 16 : insets.bottom + 16), maxHeight: '92%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text }}>{editing ? 'Editar deuda' : 'Nueva deuda'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={clay.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <ClayInput label="Nombre" value={form.name} onChangeText={(v) => set('name', v)} placeholder="Ej: Tarjeta de crédito" />
                <ClayInput label="Banco o prestamista" value={form.bank_or_lender} onChangeText={(v) => set('bank_or_lender', v)} placeholder="Ej: Bancolombia" />
                <ClayInput label="Monto total" value={form.total_amount} onChangeText={(v) => set('total_amount', v)} keyboardType="numeric" placeholder="0" />
                <ClayInput label="Pago mensual" value={form.monthly_payment} onChangeText={(v) => set('monthly_payment', v)} keyboardType="numeric" placeholder="0" />
                <ClayInput label="Tasa de interés (% anual)" value={form.interest_rate} onChangeText={(v) => set('interest_rate', v)} keyboardType="numeric" placeholder="0" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, marginBottom: 7, marginLeft: 2 }}>Tipo de interés</Text>
                <Segmented options={[{ label: 'Fijo', value: 'fixed' }, { label: 'Variable', value: 'variable' }]} value={form.interest_type} onChange={(v) => set('interest_type', v)} />
                <ClayInput label="Plazo (meses)" value={form.term_months} onChangeText={(v) => set('term_months', v)} keyboardType="numeric" placeholder="0" />
                <ClayInput label="Día de pago (1-31)" value={form.payment_day} onChangeText={(v) => set('payment_day', v)} keyboardType="numeric" placeholder="Ej: 20" />
                <ClayInput label="Día de corte (1-31)" value={form.cut_day} onChangeText={(v) => set('cut_day', v)} keyboardType="numeric" placeholder="Ej: 10" />
                <ClayDatePicker label="Fecha de inicio" value={form.start_date} onChange={(v) => set('start_date', v)} />
                <ClayDatePicker label="Fecha de finalización" value={form.end_date} onChange={(v) => set('end_date', v)} />
                {editing && (
                  <>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, marginBottom: 7, marginLeft: 2 }}>Estado</Text>
                    <Segmented
                      options={[{ label: 'Activa', value: 'active' }, { label: 'Pagada', value: 'paid' }, { label: 'En mora', value: 'defaulted' }]}
                      value={form.status} onChange={(v) => set('status', v)} />
                  </>
                )}
                <View style={{ height: 16 }} />
                <ClayButton title={editing ? 'Actualizar' : 'Guardar'} onPress={handleSave} loading={saving} />
                <View style={{ height: 8 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
