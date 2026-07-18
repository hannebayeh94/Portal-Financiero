import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
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
import { formatCurrency, formatDate } from '../utils/formatters'

const TX_TYPES = [
  { v: 'deposit', l: 'Depósito' },
  { v: 'withdrawal', l: 'Retiro' },
  { v: 'interest', l: 'Intereses' },
]
const TYPE_LABELS = { standard: 'Estándar', goal: 'Meta', investment: 'Inversión' }
const ACCOUNT_TYPES = [
  { v: 'standard', l: 'Estándar' },
  { v: 'goal', l: 'Meta' },
  { v: 'investment', l: 'Inversión' },
]

const emptyTx = () => ({ amount: '', type: 'deposit', date: new Date().toISOString().split('T')[0], description: '' })

export default function SavingsDetail({ route, navigation }) {
  const { id } = route.params
  const kb = useKeyboardHeight()
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTxModal, setShowTxModal] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [txData, setTxData] = useState(emptyTx())
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState(null)

  const fetchAccount = async () => {
    try {
      const res = await api.get(`/savings/${id}`)
      setAccount(res.data)
    } catch (e) {
      dialog.alert('Error', 'Error al cargar la cuenta'); navigation.goBack()
    } finally { setLoading(false) }
  }

  useFocusEffect(useCallback(() => { fetchAccount() }, [id]))

  const openNewTx = () => { setEditingTx(null); setTxData(emptyTx()); setShowTxModal(true) }

  const openEditTx = (t) => {
    setEditingTx(t)
    setTxData({ amount: String(t.amount), type: t.type, date: t.date.split('T')[0], description: t.description || '' })
    setShowTxModal(true)
  }

  const handleTxSubmit = async () => {
    if (!txData.amount) { dialog.alert('Error', 'Ingresa el monto'); return }
    const payload = { ...txData, amount: parseFloat(txData.amount) }
    try {
      editingTx
        ? await api.put(`/savings/${id}/transactions/${editingTx.id}`, payload)
        : await api.post(`/savings/${id}/transactions`, payload)
      setShowTxModal(false); setEditingTx(null); setTxData(emptyTx()); fetchAccount()
    } catch (e) { dialog.alert('Error', 'Error al guardar el movimiento') }
  }

  const handleTxDelete = (txId) => {
    dialog.confirm({
      title: 'Eliminar movimiento',
      message: '¿Eliminar este movimiento?',
      confirmLabel: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        try { await api.delete(`/savings/${id}/transactions/${txId}`); fetchAccount() }
        catch (e) { dialog.alert('Error', 'Error al eliminar') }
      },
    })
  }

  const openEditAccount = () => {
    setEditData({
      name: account.name, bank: account.bank, current_balance: String(account.current_balance),
      goal_amount: account.goal_amount != null ? String(account.goal_amount) : '',
      interest_rate: account.interest_rate != null ? String(account.interest_rate) : '',
      type: account.type, active: account.active,
    })
    setShowEditModal(true)
  }

  const handleAccountUpdate = async () => {
    if (!editData.name || !editData.bank || editData.current_balance === '') {
      dialog.alert('Error', 'Completa nombre, banco y saldo'); return
    }
    const payload = {
      name: editData.name, bank: editData.bank, type: editData.type, active: editData.active,
      current_balance: parseFloat(editData.current_balance) || 0,
      goal_amount: editData.goal_amount === '' ? null : parseFloat(editData.goal_amount),
      interest_rate: editData.interest_rate === '' ? 0 : parseFloat(editData.interest_rate),
    }
    try {
      await api.put(`/savings/${id}`, payload)
      setShowEditModal(false); fetchAccount()
    } catch (e) { dialog.alert('Error', 'Error al actualizar la cuenta') }
  }

  const handleAccountDelete = () => {
    dialog.confirm({
      title: 'Eliminar cuenta',
      message: `¿Eliminar "${account.name}"? Se borrarán también sus movimientos.`,
      confirmLabel: 'Eliminar',
      destructive: true,
      onConfirm: async () => {
        try { await api.delete(`/savings/${id}`); navigation.goBack() }
        catch (e) { dialog.alert('Error', 'Error al eliminar la cuenta') }
      },
    })
  }

  if (loading || !account) {
    return (
      <View style={{ flex: 1, backgroundColor: clay.bg, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', color: clay.textMuted }}>Cargando...</Text>
      </View>
    )
  }

  const progress = account.goal_amount ? Math.min(100, (parseFloat(account.current_balance) / parseFloat(account.goal_amount)) * 100) : null
  const txMeta = (type) => type === 'deposit'
    ? { icon: 'arrow-up', color: colors.success[400], label: 'Depósito', sign: '+' }
    : type === 'withdrawal'
      ? { icon: 'arrow-down', color: colors.danger[400], label: 'Retiro', sign: '-' }
      : { icon: 'trending-up', color: colors.warning[500], label: 'Intereses', sign: '+' }

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
            </TouchableOpacity>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: clay.text }}>{account.name}</Text>
                {!account.active && (
                  <View style={{ backgroundColor: clay.inset, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: clay.textMuted }}>INACTIVA</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: clay.textMuted }}>{account.bank}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={openNewTx}
            style={{ backgroundColor: colors.success[400], borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Movimiento</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ClayCard style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>Saldo actual</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.success[400], marginTop: 2 }}>{formatCurrency(account.current_balance)}</Text>
            </ClayCard>
            <ClayCard style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase' }}>Tasa</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.warning[500], marginTop: 2 }}>{account.interest_rate}%</Text>
              <Text style={{ fontSize: 11, color: clay.textMuted, marginTop: 2 }}>{TYPE_LABELS[account.type] || account.type}</Text>
            </ClayCard>
          </View>

          {/* Progress */}
          {progress !== null && (
            <ClayCard>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: clay.textMuted }}>Progreso hacia la meta</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: clay.text }}>{Math.round(progress)}%</Text>
              </View>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: clay.inset, overflow: 'hidden' }}>
                <View style={{ height: 10, borderRadius: 5, width: `${progress}%`, backgroundColor: colors.success[400] }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: clay.textMuted }}>Actual: {formatCurrency(account.current_balance)}</Text>
                <Text style={{ fontSize: 11, color: clay.textMuted }}>Meta: {formatCurrency(account.goal_amount)}</Text>
              </View>
            </ClayCard>
          )}

          {/* Account actions */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ClayButton title="Editar cuenta" variant="secondary" small onPress={openEditAccount} style={{ flex: 1 }} />
            <ClayButton title="Eliminar" variant="danger" small onPress={handleAccountDelete} style={{ flex: 1 }} />
          </View>

          {/* Transactions */}
          <Text style={{ fontSize: 13, fontWeight: '800', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4, marginLeft: 4 }}>Historial de movimientos</Text>
          {!account.transactions || account.transactions.length === 0 ? (
            <ClayCard style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="swap-vertical-outline" size={36} color={colors.dark[300]} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: clay.textMuted, marginTop: 10 }}>Sin movimientos</Text>
            </ClayCard>
          ) : account.transactions.map((t) => {
            const m = txMeta(t.type)
            return (
              <ClayCard key={t.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: clay.inset, justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2 }}>
                  <Ionicons name={m.icon} size={18} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: clay.text }}>{m.label}</Text>
                  <Text style={{ fontSize: 11, color: clay.textMuted }}>{formatDate(t.date)}</Text>
                  {!!t.description && <Text style={{ fontSize: 11, color: clay.textMuted, marginTop: 1 }}>{t.description}</Text>}
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: m.color, marginRight: 8, letterSpacing: -0.5 }}>{m.sign}{formatCurrency(t.amount)}</Text>
                <TouchableOpacity onPress={() => openEditTx(t)} style={{ padding: 6 }}>
                  <Ionicons name="create-outline" size={18} color={colors.dark[400]} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleTxDelete(t.id)} style={{ padding: 6 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger[400]} />
                </TouchableOpacity>
              </ClayCard>
            )
          })}
        </View>
      </ScrollView>

      <Modal visible={showTxModal} transparent animationType="slide" onRequestClose={() => setShowTxModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(20,23,38,0.55)', justifyContent: 'flex-end', paddingBottom: kb }}>
          <View style={{ backgroundColor: clay.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%', shadowColor: clay.shadow, shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text, letterSpacing: -0.3 }}>{editingTx ? 'Editar Movimiento' : 'Nuevo Movimiento'}</Text>
                <TouchableOpacity onPress={() => setShowTxModal(false)}><Ionicons name="close" size={24} color={colors.dark[400]} /></TouchableOpacity>
              </View>

              <View style={{ gap: 14 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Tipo</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {TX_TYPES.map((t) => (
                      <TouchableOpacity key={t.v} onPress={() => setTxData({ ...txData, type: t.v })}
                        style={{ flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: txData.type === t.v ? colors.success[400] : clay.inset, shadowColor: clay.shadow, shadowOffset: txData.type === t.v ? { width: 2, height: 2 } : { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2 }}>
                        <Text style={{ fontWeight: '800', fontSize: 12, color: txData.type === t.v ? '#fff' : clay.text }}>{t.l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <ClayInput label="Monto" value={txData.amount} onChangeText={(v) => setTxData({ ...txData, amount: v })} placeholder="0" keyboardType="decimal-pad" />
                <ClayDatePicker label="Fecha" value={txData.date} onChange={(v) => setTxData({ ...txData, date: v })} />
                <ClayInput label="Descripción (opcional)" value={txData.description} onChangeText={(v) => setTxData({ ...txData, description: v })} placeholder="Ej: Ahorro mensual" />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 }}>
                <ClayButton title="Cancelar" variant="secondary" onPress={() => setShowTxModal(false)} style={{ flex: 1 }} />
                <ClayButton title={editingTx ? 'Actualizar' : 'Registrar'} variant="success" onPress={handleTxSubmit} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(20,23,38,0.55)', justifyContent: 'flex-end', paddingBottom: kb }}>
          <View style={{ backgroundColor: clay.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%', shadowColor: clay.shadow, shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text, letterSpacing: -0.3 }}>Editar Cuenta</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}><Ionicons name="close" size={24} color={colors.dark[400]} /></TouchableOpacity>
              </View>

              {editData && (
                <View style={{ gap: 14 }}>
                  <ClayInput label="Nombre" value={editData.name} onChangeText={(v) => setEditData({ ...editData, name: v })} placeholder="Nombre" />
                  <ClayInput label="Banco" value={editData.bank} onChangeText={(v) => setEditData({ ...editData, bank: v })} placeholder="Banco" />
                  <ClayInput label="Saldo Actual" value={editData.current_balance} onChangeText={(v) => setEditData({ ...editData, current_balance: v })} placeholder="0" keyboardType="decimal-pad" />
                  <ClayInput label="Meta (opcional)" value={editData.goal_amount} onChangeText={(v) => setEditData({ ...editData, goal_amount: v })} placeholder="0" keyboardType="decimal-pad" />
                  <ClayInput label="Tasa de Interés (%)" value={editData.interest_rate} onChangeText={(v) => setEditData({ ...editData, interest_rate: v })} placeholder="0" keyboardType="decimal-pad" />

                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Tipo</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {ACCOUNT_TYPES.map((t) => (
                        <TouchableOpacity key={t.v} onPress={() => setEditData({ ...editData, type: t.v })}
                          style={{ flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: editData.type === t.v ? colors.success[400] : clay.inset, shadowColor: clay.shadow, shadowOffset: editData.type === t.v ? { width: 2, height: 2 } : { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2 }}>
                          <Text style={{ fontWeight: '800', fontSize: 12, color: editData.type === t.v ? '#fff' : clay.text }}>{t.l}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={{ marginTop: 4 }}>
                    <ClayToggle value={editData.active} onValueChange={(v) => setEditData({ ...editData, active: v })} label="Cuenta activa" />
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 }}>
                <ClayButton title="Cancelar" variant="secondary" onPress={() => setShowEditModal(false)} style={{ flex: 1 }} />
                <ClayButton title="Actualizar" variant="success" onPress={handleAccountUpdate} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
