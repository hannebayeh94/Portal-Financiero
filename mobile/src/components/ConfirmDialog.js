import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { clay, colors, shadow } from '../theme'

// Handler registrado por el DialogProvider montado en la raíz.
let _handler = null

// API imperativa con estilo clay. `dialog.alert` es un reemplazo directo de
// `Alert.alert(title, message, buttons)`, así que se usa igual en todo el app.
export const dialog = {
  alert(title, message, buttons) {
    if (_handler) _handler({ title, message, buttons })
  },
  confirm({ title, message, confirmLabel, cancelLabel, destructive, onConfirm, onCancel }) {
    if (!_handler) return
    _handler({
      title,
      message,
      buttons: [
        { text: cancelLabel || 'Cancelar', style: 'cancel', onPress: onCancel },
        { text: confirmLabel || 'Aceptar', style: destructive ? 'destructive' : 'default', onPress: onConfirm },
      ],
    })
  },
}

function appearanceFor({ title, buttons }) {
  const hasDestructive = (buttons || []).some((b) => b.style === 'destructive')
  if (hasDestructive) return { icon: 'trash-outline', tint: colors.danger, bg: colors.danger[50] }
  if (/error|falla|no se pudo|incomplet|obligator|falta/i.test(String(title || '')))
    return { icon: 'alert-circle-outline', tint: colors.danger, bg: colors.danger[50] }
  return { icon: 'information-circle-outline', tint: colors.primary, bg: colors.primary[50] }
}

export default function DialogProvider({ children }) {
  const [cfg, setCfg] = useState(null) // { title, message, buttons }
  const busy = useRef(false)

  useEffect(() => {
    _handler = (next) => { busy.current = false; setCfg(next) }
    return () => { _handler = null }
  }, [])

  const dismiss = useCallback((onPress) => {
    if (busy.current) return
    busy.current = true
    setCfg(null)
    if (typeof onPress === 'function') setTimeout(onPress, 60)
  }, [])

  const buttons = cfg?.buttons?.length ? cfg.buttons : [{ text: 'Entendido', style: 'default' }]
  const look = cfg ? appearanceFor(cfg) : null
  const stacked = buttons.length > 2

  return (
    <>
      {children}
      <Modal visible={!!cfg} transparent animationType="fade" statusBarTranslucent onRequestClose={() => dismiss()}>
        <View style={{ flex: 1, backgroundColor: 'rgba(20,23,38,0.55)', justifyContent: 'center', alignItems: 'center', padding: 28 }}>
          {cfg && (
            <View style={{
              width: '100%', maxWidth: 360, backgroundColor: clay.card, borderRadius: 26,
              padding: 24, borderWidth: 1, borderColor: clay.border, ...shadow.lg,
            }}>
              <View style={{
                width: 56, height: 56, borderRadius: 18, backgroundColor: look.bg,
                alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16,
              }}>
                <Ionicons name={look.icon} size={28} color={look.tint[500]} />
              </View>

              {!!cfg.title && (
                <Text style={{ fontSize: 19, fontWeight: '800', color: clay.text, textAlign: 'center', letterSpacing: -0.3 }}>
                  {cfg.title}
                </Text>
              )}
              {!!cfg.message && (
                <Text style={{ fontSize: 14, color: clay.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                  {cfg.message}
                </Text>
              )}

              <View style={{ flexDirection: stacked ? 'column' : 'row', gap: 10, marginTop: 22 }}>
                {buttons.map((b, i) => {
                  const isCancel = b.style === 'cancel'
                  const isDestructive = b.style === 'destructive'
                  const bg = isCancel ? clay.surface : isDestructive ? colors.danger[500] : colors.primary[500]
                  const fg = isCancel ? clay.text : '#fff'
                  return (
                    <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => dismiss(b.onPress)}
                      style={{
                        flex: stacked ? undefined : 1, backgroundColor: bg, borderRadius: 15,
                        paddingVertical: 14, alignItems: 'center',
                        borderWidth: isCancel ? 1 : 0, borderColor: clay.border,
                        ...(isCancel ? shadow.sm : shadow.md),
                      }}>
                      <Text style={{ color: fg, fontWeight: '800', fontSize: 15 }}>{b.text}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  )
}
