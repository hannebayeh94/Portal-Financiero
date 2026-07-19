import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import ClayToggle from '../components/ClayToggle'
import { useReminders } from '../context/RemindersContext'
import { dialog } from '../components/ConfirmDialog'
import { sendTestReminder } from '../utils/reminders'
import { clay, colors } from '../theme'

export default function Reminders({ navigation }) {
  const { enabled, scheduledCount, loading, toggle } = useReminders()

  const onToggle = async (value) => {
    const ok = await toggle(value)
    if (value && !ok) {
      dialog.alert('Permiso necesario', 'Activa las notificaciones para recibir recordatorios de tus vencimientos.')
    }
  }

  const onTest = async () => {
    if (!enabled) {
      const ok = await toggle(true)
      if (!ok) { dialog.alert('Permiso necesario', 'Activa las notificaciones primero.'); return }
    }
    await sendTestReminder()
    dialog.alert('Enviado', 'Recibirás una notificación de prueba en unos segundos.')
  }

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Recordatorios</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Avisos y vencimientos</Text>
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          <ClayCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications" size={22} color={colors.primary[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>Recordatorios activos</Text>
                <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: 1 }}>
                  {enabled ? `${scheduledCount} programados` : 'Desactivados'}
                </Text>
              </View>
              <ClayToggle value={enabled} onValueChange={onToggle} />
            </View>
          </ClayCard>

          <ClayCard>
            <Text style={{ fontSize: 13, fontWeight: '800', color: clay.text, marginBottom: 8 }}>¿Qué te recordaremos?</Text>
            {[
              { icon: 'card-outline', text: 'Cuotas de tus deudas activas (por su día de pago).' },
              { icon: 'repeat-outline', text: 'Egresos e ingresos marcados como recurrentes.' },
            ].map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 }}>
                <Ionicons name={r.icon} size={18} color={colors.primary[500]} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 13, color: clay.textMuted, lineHeight: 19 }}>{r.text}</Text>
              </View>
            ))}
            <Text style={{ fontSize: 11, color: clay.textMuted, marginTop: 6 }}>
              Los avisos se reprograman automáticamente cada vez que abres la app.
            </Text>
          </ClayCard>

          <ClayButton title="Probar notificación" variant="secondary" onPress={onTest} loading={loading} />
        </View>
      </ScrollView>
    </View>
  )
}
