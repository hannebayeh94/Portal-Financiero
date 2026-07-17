import { useState, useEffect } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import { colors } from '../theme'
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '../utils/formatters'

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

  const totalIncome = incomeSummary?.total || 0
  const totalExpenses = expenseSummary?.total || 0
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0.0'

  const currentMonth = getMonthName(getCurrentMonth())

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f0e8dc' }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} colors={[colors.primary[500]]} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 8 }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.dark[900] }}>Dashboard</Text>
          <Text style={{ fontSize: 13, color: colors.dark[500] }}>{currentMonth}</Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.clay.textMuted }}>{user?.name}</Text>
      </View>

      <ClayCard>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Balance Neto</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: balance >= 0 ? colors.success[500] : colors.danger[500] }}>
          {formatCurrency(balance)}
        </Text>
        <Text style={{ fontSize: 12, color: colors.clay.textMuted, marginTop: 2 }}>Tasa de ahorro: {savingsRate}%</Text>
      </ClayCard>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ClayCard style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Ingresos</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.success[500], marginTop: 4 }}>{formatCurrency(totalIncome)}</Text>
        </ClayCard>
        <ClayCard style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Egresos</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.danger[400], marginTop: 4 }}>{formatCurrency(totalExpenses)}</Text>
        </ClayCard>
      </View>

      {debtStatus && (
        <ClayCard>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Deudas Activas</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.danger[500] }}>
            {formatCurrency(debtStatus.total_debt)}
          </Text>
          <Text style={{ fontSize: 12, color: colors.clay.textMuted, marginTop: 2 }}>
            Pago mensual: {formatCurrency(debtStatus.total_monthly_payment)}
          </Text>
        </ClayCard>
      )}

      {monthlyData?.data && (
        <ClayCard>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.clay.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Evolución Mensual</Text>
          {monthlyData.data.slice(-4).reverse().map((m) => (
            <View key={m.month} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e0d4c8' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.dark[700] }}>{getMonthName(m.month)}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: m.net >= 0 ? colors.success[500] : colors.danger[400] }}>
                {formatCurrency(m.net)}
              </Text>
            </View>
          ))}
        </ClayCard>
      )}
    </ScrollView>
  )
}
