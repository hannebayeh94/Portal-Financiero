import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Modal, ScrollView, TouchableOpacity, AppState, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { clay, colors, gradients, shadow } from '../theme'
import GradientCard from './GradientCard'
import {
  isNotificationAccessEnabled,
  openNotificationSettings,
  openAppDetailsSettings,
} from '../../modules/notification-listener'

const steps = [
  {
    icon: 'ellipsis-vertical',
    title: 'Permite los "ajustes restringidos"',
    desc: 'Android bloquea este permiso en apps instaladas por fuera de la tienda. Abre la ficha de la app, toca el menú ⋮ (arriba a la derecha) y elige "Permitir ajustes restringidos".',
  },
  {
    icon: 'notifications',
    title: 'Activa el acceso a notificaciones',
    desc: 'Abre el acceso a notificaciones y activa "Portal Financiero" en la lista.',
  },
  {
    icon: 'checkmark-done',
    title: 'Vuelve a la app',
    desc: 'Regresa aquí; detectaremos automáticamente los pagos que lleguen por notificación.',
  },
]

export default function AutoCaptureGuideModal({ visible, onClose }) {
  const insets = useSafeAreaInsets()
  const [enabled, setEnabled] = useState(false)
  const appState = useRef(AppState.currentState)

  const checkStatus = useCallback(() => {
    setEnabled(isNotificationAccessEnabled())
  }, [])

  useEffect(() => {
    if (!visible) return
    checkStatus()
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        checkStatus()
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [visible, checkStatus])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(20,23,38,0.45)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: clay.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingTop: 10, paddingBottom: insets.bottom + 20, maxHeight: '88%',
        }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: clay.border, marginBottom: 14 }} />

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
            {/* Encabezado */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <GradientCard colors={gradients.brand} radius={16} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications" size={26} color="#fff" />
              </GradientCard>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text, letterSpacing: -0.4 }}>Captura automática</Text>
                <Text style={{ fontSize: 12.5, color: clay.textMuted, marginTop: 2 }}>Registra tus pagos leyendo las notificaciones del banco.</Text>
              </View>
            </View>

            {/* Estado */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
              backgroundColor: enabled ? colors.success[50] : colors.warning[50],
              borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, marginTop: 14, marginBottom: 4,
            }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: enabled ? colors.success[400] : colors.warning[400] }} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: enabled ? colors.success[500] : colors.warning[500] }}>
                {enabled ? 'Activo · detectando pagos' : 'Inactivo · falta el permiso'}
              </Text>
            </View>

            {Platform.OS !== 'android' && (
              <Text style={{ fontSize: 12.5, color: clay.textMuted, marginTop: 10 }}>
                La captura automática solo está disponible en Android.
              </Text>
            )}

            {/* Pasos */}
            <View style={{ marginTop: 16, gap: 10 }}>
              {steps.map((s, i) => (
                <View key={i} style={{
                  flexDirection: 'row', gap: 12, backgroundColor: clay.card, borderRadius: 18,
                  padding: 14, borderWidth: 1, borderColor: clay.border, ...shadow.sm,
                }}>
                  <View style={{
                    width: 30, height: 30, borderRadius: 10, backgroundColor: colors.primary[50],
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary[600] }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '700', color: clay.text }}>{s.title}</Text>
                    <Text style={{ fontSize: 12.5, color: clay.textMuted, marginTop: 3, lineHeight: 18 }}>{s.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Acciones */}
            <View style={{ marginTop: 18, gap: 10 }}>
              <TouchableOpacity onPress={openAppDetailsSettings} activeOpacity={0.85} style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: clay.card, borderRadius: 16, paddingVertical: 15,
                borderWidth: 1, borderColor: clay.border, ...shadow.sm,
              }}>
                <Ionicons name="ellipsis-vertical" size={18} color={colors.primary[600]} />
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: clay.text }}>Permitir ajustes restringidos</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={openNotificationSettings} activeOpacity={0.85} style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: colors.primary[500], borderRadius: 16, paddingVertical: 15, ...shadow.brand,
              }}>
                <Ionicons name="notifications" size={18} color="#fff" />
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#fff' }}>Abrir acceso a notificaciones</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: clay.textMuted }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
