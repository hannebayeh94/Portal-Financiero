import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { clay, colors } from '../theme'
import { formatCurrency, getMonthName, getCurrentMonth } from '../utils/formatters'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [monthlyData, setMonthlyData] = useState(null)
  const [expenseSummary, setExpenseSummary] = useState(null)
  const [incomeSummary, setIncomeSummary] = useState(null)
  const [debtStatus, setDebtStatus] = useState(null)

  const fetchData = async () => {
    try {
      const [monthly, income, expense, debts] = await Promise.all([
        api.get('/reports/monthly-evolution'),
        api.get('/incomes/summary'),
        api.get('/expenses/summary'),
        api.get('/reports/debt-status'),
      ])
      setMonthlyData(monthly.data)
      setIncomeSummary(income.data)
      setExpenseSummary(expense.data)
      setDebtStatus(debts.data)
    } catch (e) {
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ])
  }

  const totalIncome = incomeSummary?.total || 0
  const totalExpenses = expenseSummary?.total || 0
  const balance = totalIncome - totalExpenses

  const currentMonthName = getMonthName(getCurrentMonth())

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: clay.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }}
          colors={[colors.primary[500]]} tintColor={colors.primary[500]} />
      }
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8,
        backgroundColor: clay.card,
        borderBottomWidth: 1, borderBottomColor: clay.highlight,
        shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
      }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted, letterSpacing: 0.3 }}>
            {currentMonthName}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: clay.text, marginTop: 2, letterSpacing: -0.5 }}>
            {user?.name?.split(' ')[0] || 'Usuario'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{
            backgroundColor: clay.card, borderRadius: 16, padding: 10,
            shadowColor: clay.shadow, shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
          }}>
            <Ionicons name="notifications-outline" size={22} color={clay.textMuted} />
          </View>
          <TouchableOpacity onPress={handleLogout} style={{
            backgroundColor: '#e8ddd0', borderRadius: 16, padding: 10,
            shadowColor: clay.shadow, shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
          }}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger[400]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 16, gap: 14, marginTop: 4 }}>

        {/* Balance Card */}
        <ClayCard>
          <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
            Balance Neto
          </Text>
          <Text style={{ fontSize: 34, fontWeight: '800', color: balance >= 0 ? colors.success[400] : colors.danger[400], letterSpacing: -1 }}>
            {formatCurrency(balance)}
          </Text>
          <View style={{ height: 2, backgroundColor: '#e0d4c8', marginVertical: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 11, color: clay.textMuted }}>Ingresos</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.success[400] }}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: clay.textMuted }}>Egresos</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.danger[400] }}>{formatCurrency(totalExpenses)}</Text>
            </View>
          </View>
        </ClayCard>

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[
            { label: 'Ingresos', value: formatCurrency(totalIncome), color: colors.success[400], icon: 'trending-up-outline' },
            { label: 'Egresos', value: formatCurrency(totalExpenses), color: colors.danger[400], icon: 'trending-down-outline' },
          ].map((stat) => (
            <ClayCard key={stat.label} small style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name={stat.icon} size={16} color={stat.color} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {stat.label}
                </Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: stat.color, letterSpacing: -0.5 }}>
                {stat.value}
              </Text>
            </ClayCard>
          ))}
        </View>

        {/* Debt Status */}
        {debtStatus && parseFloat(debtStatus.total_debt) > 0 && (
          <ClayCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Ionicons name="card-outline" size={18} color={colors.danger[400]} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Deudas Activas
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.danger[400], letterSpacing: -0.5 }}>
              {formatCurrency(debtStatus.total_debt)}
            </Text>
            <Text style={{ fontSize: 13, color: clay.textMuted, marginTop: 2 }}>
              Pago mensual: {formatCurrency(debtStatus.total_monthly_payment)}
            </Text>
          </ClayCard>
        )}

        {/* Monthly Evolution */}
        {monthlyData?.data && (
          <ClayCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Ionicons name="stats-chart-outline" size={18} color={colors.primary[500]} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Evolución Mensual
              </Text>
            </View>
            {monthlyData.data.slice(-4).reverse().map((m, i) => {
              const isPositive = m.net >= 0
              return (
                <View key={m.month} style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: i < 3 ? 1 : 0,
                  borderBottomColor: '#e0d4c8',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: clay.text }}>
                    {getMonthName(m.month)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons
                      name={isPositive ? 'caret-up' : 'caret-down'}
                      size={14}
                      color={isPositive ? colors.success[400] : colors.danger[400]}
                    />
                    <Text style={{
                      fontSize: 15, fontWeight: '800',
                      color: isPositive ? colors.success[400] : colors.danger[400],
                    }}>
                      {formatCurrency(Math.abs(m.net))}
                    </Text>
                  </View>
                </View>
              )
            })}
          </ClayCard>
        )}

      </View>
    </ScrollView>
  )
}
