import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { dialog } from '../components/ConfirmDialog'
import api from '../api/client'
import ClayCard from '../components/ClayCard'
import GradientCard from '../components/GradientCard'
import { ClayLineChart } from '../components/ClayChart'
import { clay, colors, gradients, shadow } from '../theme'
import { formatCurrency, getMonthName, getCurrentMonth } from '../utils/formatters'

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

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
    dialog.confirm({
      title: 'Cerrar sesión',
      message: '¿Seguro que quieres salir de tu cuenta?',
      confirmLabel: 'Salir',
      destructive: true,
      onConfirm: logout,
    })
  }

  const totalIncome = incomeSummary?.total || 0
  const totalExpenses = expenseSummary?.total || 0
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0
  const currentMonthName = getMonthName(getCurrentMonth())

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: clay.bg }}
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }}
          colors={[colors.primary[500]]} tintColor={colors.primary[500]} />
      }
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: clay.textMuted, letterSpacing: 0.2 }}>{currentMonthName} · Hola 👋</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, marginTop: 2, letterSpacing: -0.5 }}>
            {user?.name?.split(' ')[0] || 'Usuario'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ backgroundColor: clay.card, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: clay.border, ...shadow.sm }}>
            <Ionicons name="notifications-outline" size={20} color={clay.text} />
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: clay.card, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: clay.border, ...shadow.sm }}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        {/* Hero balance card */}
        <GradientCard colors={gradients.brand} radius={26} style={{ ...shadow.brand }}>
          <View style={{ padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 }}>Balance neto</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={balance >= 0 ? 'trending-up' : 'trending-down'} size={13} color="#fff" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>{savingsRate}% ahorro</Text>
              </View>
            </View>
            <Text style={{ fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 6 }}>
              {formatCurrency(balance)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 22, marginTop: 18 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="arrow-up" size={13} color="#fff" />
                  </View>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>Ingresos</Text>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 4 }}>{formatCurrency(totalIncome)}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="arrow-down" size={13} color="#fff" />
                  </View>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>Egresos</Text>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 4 }}>{formatCurrency(totalExpenses)}</Text>
              </View>
            </View>
          </View>
        </GradientCard>

        {/* Stat tiles */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatTile label="Ingresos" value={formatCurrency(totalIncome)} icon="trending-up" tint={colors.success} bg={colors.success[50]} />
          <StatTile label="Egresos" value={formatCurrency(totalExpenses)} icon="trending-down" tint={colors.danger} bg={colors.danger[50]} />
        </View>

        {/* Debt status */}
        {debtStatus && parseFloat(debtStatus.total_debt) > 0 && (
          <ClayCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.warning[50], alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="card" size={22} color={colors.warning[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted }}>Deudas activas</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: clay.text, letterSpacing: -0.5 }}>{formatCurrency(debtStatus.total_debt)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: clay.textMuted }}>Pago mensual</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.warning[500] }}>{formatCurrency(debtStatus.total_monthly_payment)}</Text>
              </View>
            </View>
          </ClayCard>
        )}

        {/* Monthly evolution chart */}
        {monthlyData?.data && (() => {
          const last6 = monthlyData.data.slice(-6)
          const hasData = last6.some(m => m.income > 0 || m.expenses > 0)
          if (!hasData) return null
          return (
            <ClayCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="trending-up" size={16} color={colors.primary[500]} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: clay.text, letterSpacing: 0.1 }}>Ingresos vs Egresos</Text>
              </View>
              <ClayLineChart
                labels={last6.map(m => MONTHS_SHORT[m.month - 1])}
                datasets={[
                  { data: last6.map(m => m.income), color: colors.success[500] },
                  { data: last6.map(m => m.expenses), color: colors.danger[500] },
                ]}
                legend={['Ingresos', 'Egresos']}
              />
            </ClayCard>
          )
        })()}

        {/* Monthly evolution */}
        {monthlyData?.data && (
          <ClayCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Ionicons name="stats-chart" size={16} color={colors.primary[500]} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: clay.text, letterSpacing: 0.1 }}>Evolución mensual</Text>
            </View>
            {monthlyData.data.slice(-4).reverse().map((m, i, arr) => {
              const isPositive = m.net >= 0
              return (
                <View key={m.month} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: clay.border }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: clay.text }}>{getMonthName(m.month)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: isPositive ? colors.success[50] : colors.danger[50], borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name={isPositive ? 'caret-up' : 'caret-down'} size={12} color={isPositive ? colors.success[500] : colors.danger[500]} />
                      <Text style={{ fontSize: 14, fontWeight: '800', color: isPositive ? colors.success[500] : colors.danger[500] }}>
                        {formatCurrency(Math.abs(m.net))}
                      </Text>
                    </View>
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

function StatTile({ label, value, icon, tint, bg }) {
  return (
    <View style={{ flex: 1, backgroundColor: clay.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: clay.border, ...shadow.sm }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Ionicons name={icon} size={20} color={tint[500]} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: clay.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>{value}</Text>
    </View>
  )
}
