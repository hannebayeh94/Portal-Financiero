import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import ClayInput from '../components/ClayInput'
import ClayButton from '../components/ClayButton'
import ClayDatePicker from '../components/ClayDatePicker'
import { clay, colors } from '../theme'
import { formatCurrency, formatDate } from '../utils/formatters'

const today = () => new Date().toISOString().split('T')[0]

function Stat({ label, value, color }) {
  return (
    <ClayCard style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '800', color: color || clay.text, marginTop: 4 }}>{value}</Text>
    </ClayCard>
  )
}

export default function DebtDetail({ route, navigation }) {
  const { id } = route.params
  const [debt, setDebt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentModal, setPaymentModal] = useState(false)
  const [chargeModal, setChargeModal] = useState(false)
  const [editMovModal, setEditMovModal] = useState(false)
  const [editingMov, setEditingMov] = useState(null)
  const [payForm, setPayForm] = useState({ amount: '', payment_date: today() })
  const [chargeForm, setChargeForm] = useState({ amount: '', payment_date: today(), description: '' })
  const [editForm, setEditForm] = useState({ amount: '', payment_date: today() })
  const [saving, setSaving] = useState(false)
  const insets = useSafeAreaInsets()

  const fetchDebt = useCallback(async () => {
    try {
      const r = await api.get(`/debts/${id}`)
      setDebt(r.data)
    } catch {
      Alert.alert('Error', 'No se pudo cargar la deuda')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }, [id, navigation])

  useEffect(() => { fetchDebt() }, [fetchDebt])

  const registerPayment = async () => {
    if (!payForm.amount) { Alert.alert('Falta el monto', 'Ingresa el monto del pago'); return }
    setSaving(true)
    try {
      await api.post(`/debts/${id}/payments`, payForm)
      setPaymentModal(false)
      setPayForm({ amount: '', payment_date: today() })
      await fetchDebt()
    } catch {
      Alert.alert('Error', 'No se pudo registrar el pago')
    } finally { setSaving(false) }
  }

  const registerCharge = async () => {
    if (!chargeForm.amount) { Alert.alert('Falta el monto', 'Ingresa el monto del consumo'); return }
    setSaving(true)
    try {
      await api.post(`/debts/${id}/charges`, chargeForm)
      setChargeModal(false)
      setChargeForm({ amount: '', payment_date: today(), description: '' })
      await fetchDebt()
    } catch {
      Alert.alert('Error', 'No se pudo registrar el consumo')
    } finally { setSaving(false) }
  }

  const openEditMov = (mov) => {
    setEditingMov(mov)
    setEditForm({ amount: String(mov.amount), payment_date: (mov.payment_date || '').split('T')[0] })
    setEditMovModal(true)
  }

  const updateMov = async () => {
    setSaving(true)
    try {
      await api.put(`/debts/${id}/payments/${editingMov.id}`, editForm)
      setEditMovModal(false)
      setEditingMov(null)
      await fetchDebt()
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el movimiento')
    } finally { setSaving(false) }
  }

  const deleteMov = (mov) => {
    const label = mov.type === 'charge' ? 'consumo' : 'pago'
    Alert.alert('Eliminar', `¿Eliminar este ${label}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.delete(`/debts/${id}/payments/${mov.id}`); await fetchDebt() }
        catch { Alert.alert('Error', 'No se pudo eliminar') }
      } },
    ])
  }

  const deleteDebt = () => {
    Alert.alert('Eliminar deuda', `¿Eliminar "${debt.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.delete(`/debts/${id}`); navigation.goBack() }
        catch { Alert.alert('Error', 'No se pudo eliminar la deuda') }
      } },
    ])
  }

  if (loading || !debt) {
    return (
      <View style={{ flex: 1, backgroundColor: clay.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    )
  }

  const paidPct = parseFloat(debt.total_amount) > 0
    ? Math.round(((parseFloat(debt.total_amount) - parseFloat(debt.current_balance)) / parseFloat(debt.total_amount)) * 100)
    : 0
  const movements = debt.payments || []

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text, letterSpacing: -0.5 }} numberOfLines={1}>{debt.name}</Text>
                <Text style={{ fontSize: 12, color: clay.textMuted }}>{debt.bank_or_lender}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={deleteDebt} style={{ padding: 6 }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger[400]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Stat label="Saldo actual" value={formatCurrency(debt.current_balance)} color={colors.danger[400]} />
            <Stat label="Pago mensual" value={formatCurrency(debt.monthly_payment)} color={colors.primary[500]} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Stat label="Tasa" value={`${debt.interest_rate}%`} color={colors.warning[500]} />
            <Stat label="Meses rest." value={String(debt.remaining_months)} />
          </View>

          <ClayCard style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: clay.textMuted }}>Progreso de pago</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: clay.text }}>{paidPct}%</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: clay.inset, overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(0, Math.min(100, paidPct))}%`, height: '100%', borderRadius: 4, backgroundColor: colors.success[500] }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: clay.textMuted }}>Pagado: {formatCurrency(parseFloat(debt.total_amount) - parseFloat(debt.current_balance))}</Text>
              <Text style={{ fontSize: 11, color: clay.textMuted }}>Total: {formatCurrency(debt.total_amount)}</Text>
            </View>
          </ClayCard>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ClayButton title="Registrar pago" variant="success" onPress={() => setPaymentModal(true)} style={{ flex: 1 }} />
            <ClayButton title="Agregar consumo" variant="secondary" onPress={() => setChargeModal(true)} style={{ flex: 1 }} />
          </View>

          <Text style={{ fontSize: 16, fontWeight: '800', color: clay.text, marginTop: 8, marginLeft: 2 }}>Movimientos</Text>
          {movements.length === 0 ? (
            <ClayCard style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Text style={{ color: clay.textMuted, fontWeight: '600' }}>Sin movimientos</Text>
            </ClayCard>
          ) : movements.map((m) => {
            const isCharge = m.type === 'charge'
            return (
              <ClayCard key={m.id} style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: (isCharge ? colors.danger[400] : colors.success[500]) + '20', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={isCharge ? 'add' : 'remove'} size={18} color={isCharge ? colors.danger[400] : colors.success[500]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: clay.text }}>{isCharge ? 'Consumo' : 'Abono'}{m.description ? ` · ${m.description}` : ''}</Text>
                      <Text style={{ fontSize: 11, color: clay.textMuted, marginTop: 1 }}>{formatDate(m.payment_date)}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: isCharge ? colors.danger[400] : colors.success[500] }}>
                    {isCharge ? '+' : '−'}{formatCurrency(m.amount)}
                  </Text>
                  <TouchableOpacity onPress={() => openEditMov(m)} style={{ padding: 4, marginLeft: 8 }}><Ionicons name="create-outline" size={17} color={colors.primary[500]} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteMov(m)} style={{ padding: 4 }}><Ionicons name="trash-outline" size={17} color={colors.danger[400]} /></TouchableOpacity>
                </View>
              </ClayCard>
            )
          })}
        </View>
      </ScrollView>

      {/* Payment modal */}
      <MovModal
        visible={paymentModal} title="Registrar pago" onClose={() => setPaymentModal(false)}
        insets={insets} saving={saving} onSave={registerPayment} saveLabel="Registrar" accent="success">
        <ClayInput label="Monto" value={payForm.amount} onChangeText={(v) => setPayForm(f => ({ ...f, amount: v }))} keyboardType="numeric" placeholder="0" />
        <ClayDatePicker label="Fecha de pago" value={payForm.payment_date} onChange={(v) => setPayForm(f => ({ ...f, payment_date: v }))} />
      </MovModal>

      {/* Charge modal */}
      <MovModal
        visible={chargeModal} title="Agregar consumo" subtitle="Aumenta el saldo por una nueva compra o cargo"
        onClose={() => setChargeModal(false)} insets={insets} saving={saving} onSave={registerCharge} saveLabel="Agregar">
        <ClayInput label="Monto del consumo" value={chargeForm.amount} onChangeText={(v) => setChargeForm(f => ({ ...f, amount: v }))} keyboardType="numeric" placeholder="0" />
        <ClayInput label="Descripción (opcional)" value={chargeForm.description} onChangeText={(v) => setChargeForm(f => ({ ...f, description: v }))} placeholder="Ej: Compra supermercado" />
        <ClayDatePicker label="Fecha" value={chargeForm.payment_date} onChange={(v) => setChargeForm(f => ({ ...f, payment_date: v }))} />
      </MovModal>

      {/* Edit movement modal */}
      <MovModal
        visible={editMovModal} title={editingMov?.type === 'charge' ? 'Editar consumo' : 'Editar pago'}
        onClose={() => setEditMovModal(false)} insets={insets} saving={saving} onSave={updateMov} saveLabel="Actualizar">
        <ClayInput label="Monto" value={editForm.amount} onChangeText={(v) => setEditForm(f => ({ ...f, amount: v }))} keyboardType="numeric" placeholder="0" />
        <ClayDatePicker label="Fecha" value={editForm.payment_date} onChange={(v) => setEditForm(f => ({ ...f, payment_date: v }))} />
      </MovModal>
    </View>
  )
}

function MovModal({ visible, title, subtitle, onClose, insets, saving, onSave, saveLabel, accent, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(45,52,54,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: clay.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20, paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text }}>{title}</Text>
                {subtitle ? <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: 2 }}>{subtitle}</Text> : null}
              </View>
              <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={clay.textMuted} /></TouchableOpacity>
            </View>
            {children}
            <View style={{ height: 16 }} />
            <ClayButton title={saveLabel} variant={accent || 'primary'} onPress={onSave} loading={saving} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
