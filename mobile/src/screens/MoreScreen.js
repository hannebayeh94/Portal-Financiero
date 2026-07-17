import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { clay, colors } from '../theme'

const items = [
  { name: 'Debts', label: 'Deudas', icon: 'card-outline', color: colors.danger[400], desc: 'Controla tus deudas activas' },
  { name: 'Savings', label: 'Ahorros', icon: 'wallet-outline', color: colors.success[400], desc: 'Metas y cuentas de ahorro' },
  { name: 'Reports', label: 'Reportes', icon: 'document-text-outline', color: colors.primary[500], desc: 'Flujo de caja y análisis' },
  { name: 'Calculator', label: 'Calculadora', icon: 'calculator-outline', color: colors.warning[500], desc: 'Simula créditos y pagos' },
  { name: 'Projections', label: 'Proyecciones', icon: 'eye-outline', color: '#a07dd0', desc: 'Escenarios financieros' },
]

export default function MoreScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <View style={{
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
        backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.highlight,
        shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
      }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Más</Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>
          Herramientas
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingTop: 20 }}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.name}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
            style={{
              backgroundColor: clay.card, borderRadius: 20, padding: 16,
              flexDirection: 'row', alignItems: 'center', gap: 14,
              shadowColor: clay.shadow, shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
              borderWidth: 1, borderColor: clay.highlight,
            }}
          >
            <View style={{
              width: 48, height: 48, borderRadius: 16,
              backgroundColor: '#e8ddd0', justifyContent: 'center', alignItems: 'center',
              shadowColor: clay.shadow, shadowOffset: { width: -3, height: -3 },
              shadowOpacity: 0.4, shadowRadius: 4, elevation: 2,
            }}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: clay.text }}>{item.label}</Text>
              <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: 2 }}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.dark[300]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}
