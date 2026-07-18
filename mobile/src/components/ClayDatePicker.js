import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { clay, colors, shadow } from '../theme'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const pad = (n) => String(n).padStart(2, '0')

// Parse 'YYYY-MM-DD' as a local date (avoids UTC shift from new Date(str))
const parseDate = (str) => {
  if (str && /^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.split('T')[0].split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date()
}
const toStr = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const displayDate = (str) => {
  const d = parseDate(str)
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
}

export default function ClayDatePicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = parseDate(value)
  const [view, setView] = useState({ year: selected.getFullYear(), month: selected.getMonth() })

  const openPicker = () => {
    const s = parseDate(value)
    setView({ year: s.getFullYear(), month: s.getMonth() })
    setOpen(true)
  }

  const changeMonth = (delta) => {
    let m = view.month + delta
    let y = view.year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setView({ year: y, month: m })
  }

  const firstWeekday = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const today = new Date()

  const isSel = (day) => selected.getFullYear() === view.year && selected.getMonth() === view.month && selected.getDate() === day
  const isToday = (day) => today.getFullYear() === view.year && today.getMonth() === view.month && today.getDate() === day

  const pick = (day) => { onChange(toStr(new Date(view.year, view.month, day))); setOpen(false) }

  return (
    <View style={{ marginBottom: 4 }}>
      {label && (
        <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, letterSpacing: 0.2, marginBottom: 7, marginLeft: 2 }}>{label}</Text>
      )}
      <TouchableOpacity activeOpacity={0.8} onPress={openPicker}
        style={{ backgroundColor: clay.surface, borderRadius: 14, borderWidth: 1, borderColor: clay.border, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: value ? clay.text : clay.placeholder }}>
          {value ? displayDate(value) : 'Seleccionar fecha'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.primary[500]} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(45,52,54,0.6)', justifyContent: 'center', padding: 24 }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}
            style={{ backgroundColor: clay.card, borderRadius: 24, padding: 20, ...shadow.lg }}>
            {/* Month navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
                <Ionicons name="chevron-back" size={22} color={colors.dark[600]} />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '800', color: clay.text }}>{MONTHS[view.month]} {view.year}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 8 }}>
                <Ionicons name="chevron-forward" size={22} color={colors.dark[600]} />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={{ flexDirection: 'row' }}>
              {WEEKDAYS.map((w) => (
                <View key={w} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: clay.textMuted }}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cells.map((day, i) => (
                <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
                  {day && (
                    <TouchableOpacity onPress={() => pick(day)} activeOpacity={0.7}
                      style={{ flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isSel(day) ? colors.primary[500] : 'transparent', borderWidth: isToday(day) && !isSel(day) ? 1.5 : 0, borderColor: colors.primary[400] }}>
                      <Text style={{ fontSize: 14, fontWeight: isSel(day) ? '800' : '600', color: isSel(day) ? '#fff' : clay.text }}>{day}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <TouchableOpacity onPress={() => { const t = new Date(); onChange(toStr(t)); setOpen(false) }} style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary[500] }}>Hoy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOpen(false)} style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: clay.textMuted }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
