import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { dialog } from '../components/ConfirmDialog'
import ClayCard from '../components/ClayCard'
import ClayInput from '../components/ClayInput'
import ClayButton from '../components/ClayButton'
import { clay, colors, shadow } from '../theme'

export default function ChangePassword({ navigation }) {
  const { changePassword } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirm) {
      dialog.alert('Falta información', 'Completa todos los campos')
      return
    }
    if (newPassword !== confirm) {
      dialog.alert('Error', 'Las contraseñas nuevas no coinciden')
      return
    }
    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      dialog.alert('Listo', 'Contraseña actualizada')
      navigation.goBack()
    } catch (error) {
      dialog.alert('Error', error.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, ...shadow.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Seguridad</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Cambiar contraseña</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <ClayCard>
          <View style={{ gap: 16 }}>
            <ClayInput
              label="Contraseña actual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              secureTextEntry={!show}
            />
            <ClayInput
              label="Nueva contraseña (mínimo 8 caracteres)"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              secureTextEntry={!show}
              rightElement={
                <TouchableOpacity onPress={() => setShow(!show)}>
                  <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.dark[400]} />
                </TouchableOpacity>
              }
            />
            <ClayInput
              label="Confirmar nueva contraseña"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              secureTextEntry={!show}
            />

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: clay.inset, borderRadius: 12, padding: 12 }}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary[500]} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 12, color: clay.textMuted, lineHeight: 18 }}>
                Al cambiar la contraseña se cerrarán todas tus demás sesiones por seguridad.
              </Text>
            </View>

            <ClayButton title="Actualizar contraseña" onPress={handleSubmit} loading={loading} />
          </View>
        </ClayCard>
      </ScrollView>
    </View>
  )
}
