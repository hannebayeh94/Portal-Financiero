import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import GradientCard from '../components/GradientCard'
import AutoCaptureGuideModal from '../components/AutoCaptureGuideModal'
import { useNotifications } from '../context/NotificationContext'
import { clay, colors, gradients, shadow } from '../theme'

const items = [
  { name: 'Budgets', label: 'Presupuestos', icon: 'pie-chart', grad: gradients.brand, desc: 'Límites de gasto por categoría' },
  { name: 'Debts', label: 'Deudas', icon: 'card', grad: gradients.debt, desc: 'Controla tus deudas activas' },
  { name: 'Savings', label: 'Ahorros', icon: 'wallet', grad: gradients.savings, desc: 'Metas y cuentas de ahorro' },
  { name: 'Reports', label: 'Reportes', icon: 'document-text', grad: gradients.report, desc: 'Flujo de caja y análisis' },
  { name: 'Calculator', label: 'Calculadora', icon: 'calculator', grad: gradients.calc, desc: 'Simula créditos y pagos' },
  { name: 'Projections', label: 'Proyecciones', icon: 'eye', grad: gradients.projection, desc: 'Escenarios financieros' },
  { name: 'Simulator', label: 'Simulador', icon: 'analytics', grad: gradients.report, desc: 'Simula tu flujo de caja a futuro' },
  { name: 'Reminders', label: 'Recordatorios', icon: 'notifications', grad: gradients.income, desc: 'Avisos de vencimientos y recurrentes' },
  { name: 'Security', label: 'Seguridad', icon: 'lock-closed', grad: gradients.report, desc: 'Bloqueo con PIN y biometría' },
]

function Row({ icon, grad, label, desc, onPress, badge }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={{ backgroundColor: clay.card, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: clay.border, ...shadow.sm }}>
      <GradientCard colors={grad} radius={14} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={23} color="#fff" />
      </GradientCard>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: clay.text }}>{label}</Text>
        <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: 2 }}>{desc}</Text>
      </View>
      {badge > 0 && (
        <View style={{ minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, backgroundColor: colors.danger[400], alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={clay.textMuted} />
    </TouchableOpacity>
  )
}

export default function MoreScreen({ navigation }) {
  const [guideVisible, setGuideVisible] = useState(false)
  const { pendingPayments } = useNotifications()

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: clay.textMuted }}>Más</Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Herramientas</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 24 }}>
        {items.map((item) => (
          <Row key={item.name} {...item} onPress={() => navigation.navigate(item.name)} />
        ))}
        <View style={{ height: 6 }} />
        <Row icon="notifications" grad={gradients.brand} label="Captura automática"
          desc="Detecta pagos de notificaciones automáticamente" onPress={() => setGuideVisible(true)} />
        <Row icon="receipt" grad={gradients.report} label="Pagos detectados"
          desc="Revisa y registra los pagos pendientes" badge={pendingPayments.length}
          onPress={() => navigation.navigate('PaymentsHistory')} />
      </ScrollView>

      <AutoCaptureGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </View>
  )
}
