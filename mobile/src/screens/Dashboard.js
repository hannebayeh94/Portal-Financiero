import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { dialog } from '../components/ConfirmDialog'
import ClayCard from '../components/ClayCard'
import FlowMap from '../components/FlowMap'
import { ClayLineChart } from '../components/ClayChart'
import {
  useDashboardData,
  useInsights,
} from '../hooks/useFinanceQueries'
import { clay, colors, accent, shadow, fonts, flowPalette } from '../theme'
import { formatCurrency, getMonthName, getCurrentMonth } from '../utils/formatters'

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const INSIGHT_STYLE = {
  warning: { icon: 'warning', color: '#C24E36', bg: '#FBEAE5' },
  positive: { icon: 'checkmark-circle', color: '#3A6A34', bg: '#E8F4E5' },
  tip: { icon: 'bulb', color: '#A5691A', bg: '#FAF0DE' },
  info: { icon: 'information-circle', color: '#14666B', bg: '#E3F1F1' },
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const {
    loading,
    monthlyData,
    incomeSummary,
    expenseSummary,
    debtStatus,
    categoriesData,
    refetchAll,
  } = useDashboardData()
  const { data: insightsData } = useInsights()
  const insights = insightsData?.insights || []
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refetchAll()
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = () => {
    dialog.confirm({
      title: 'Cerrar sesión',
      message: '¿Seguro que quieres salir de tu cuenta?',
      confirmLabel: 'Salir',
      destructive: true,
      onConfirm: logout,
    })
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: clay.bg }}>
        <Ionicons name="git-branch-outline" size={40} color={colors.primary[500]} />
      </View>
    )
  }

  const totalIncome = Number(incomeSummary?.total) || 0
  const totalExpenses = Number(expenseSummary?.total) || 0
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0
  const currentMonthName = getMonthName(getCurrentMonth())

  /* Corrientes del mapa: top 4 categorías de gasto (menos ancho en móvil) */
  const flowStreams = [...categoriesData]
    .filter((c) => c.category && Number(c.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 4)
    .map((c, i) => ({
      label: c.category.length > 12 ? c.category.slice(0, 11) + '…' : c.category,
      value: Number(c.total),
      color: flowPalette[(i + 1) % flowPalette.length],
    }))

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: clay.bg }}
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          colors={[colors.primary[500]]} tintColor={colors.primary[500]} />
      }
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <Text style={{ fontSize: 12, fontFamily: fonts.monoSemiBold, color: accent.water, letterSpacing: 2, textTransform: 'uppercase' }}>
          Resumen · {currentMonthName}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 28, fontFamily: fonts.display, color: clay.text, letterSpacing: -0.5 }}>
            El flujo de tu mes
          </Text>
          <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: clay.card, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: clay.border, ...shadow.sm }}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        {/* Firma visual: mapa de flujo */}
        <ClayCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Ionicons name="git-branch-outline" size={16} color={accent.water} />
            <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: clay.text }}>A dónde se va tu plata</Text>
          </View>
          <FlowMap income={totalIncome} streams={flowStreams} formatValue={formatCurrency} />
        </ClayCard>

        {/* Insights proactivos */}
        {insights.length > 0 && (
          <View style={{ gap: 10 }}>
            {insights.slice(0, 4).map((ins) => {
              const style = INSIGHT_STYLE[ins.type] || INSIGHT_STYLE.info
              return (
                <View key={ins.id} style={{
                  flexDirection: 'row', alignItems: 'flex-start', gap: 10,
                  backgroundColor: style.bg, borderRadius: 18,
                  padding: 14, borderWidth: 1, borderColor: clay.border,
                }}>
                  <Ionicons name={style.icon} size={18} color={style.color} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontFamily: fonts.bodyBold, color: style.color }}>
                      {ins.title}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: fonts.body, color: clay.textMuted, marginTop: 3, lineHeight: 17 }}>
                      {ins.detail}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Balance neto */}
        <ClayCard>
          <Text style={{ fontSize: 12, fontFamily: fonts.monoSemiBold, color: accent.water, letterSpacing: 2, textTransform: 'uppercase' }}>
            Balance neto del mes
          </Text>
          <Text style={{
            fontSize: 36, fontFamily: fonts.monoSemiBold, letterSpacing: -1, marginTop: 8,
            color: balance >= 0 ? clay.text : colors.danger[500],
          }}>
            {formatCurrency(balance)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 22, marginTop: 16 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="arrow-up" size={13} color={accent.waterDark} />
              <Text style={{ fontSize: 13, fontFamily: fonts.body, color: clay.textMuted }}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: clay.border }} />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="arrow-down" size={13} color={colors.danger[500]} />
              <Text style={{ fontSize: 13, fontFamily: fonts.body, color: clay.textMuted }}>{formatCurrency(totalExpenses)}</Text>
            </View>
          </View>
        </ClayCard>

        {/* Tasa de ahorro */}
        <ClayCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.bodySemiBold, color: clay.textMuted }}>Tasa de ahorro</Text>
              <Text style={{ fontSize: 30, fontFamily: fonts.monoSemiBold, color: accent.waterDark, marginTop: 2 }}>
                {savingsRate}%
              </Text>
              <Text style={{ fontSize: 11, fontFamily: fonts.body, color: clay.textMuted, marginTop: 2 }}>
                de tu ingreso se vuelve patrimonio
              </Text>
            </View>
            <Ionicons name="pie-chart-outline" size={44} color={colors.primary[200]} />
          </View>
          <View style={{ height: 10, borderRadius: 999, backgroundColor: clay.inset, borderWidth: 1, borderColor: clay.border, overflow: 'hidden', marginTop: 14 }}>
            <View style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, savingsRate))}%`,
              borderRadius: 999,
              backgroundColor: accent.water,
            }} />
          </View>
        </ClayCard>

        {/* Stat tiles */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatTile label="Ingresos" value={formatCurrency(totalIncome)} icon="trending-up" tint={accent.waterDark} bg={colors.primary[50]} />
          <StatTile label="Egresos" value={formatCurrency(totalExpenses)} icon="trending-down" tint={colors.danger[500]} bg={colors.danger[50]} />
        </View>

        {/* Debt status */}
        {debtStatus && parseFloat(debtStatus.total_debt) > 0 && (
          <ClayCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.warning[50], alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="card" size={22} color={accent.amberDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontFamily: fonts.bodySemiBold, color: clay.textMuted }}>Deudas activas</Text>
                <Text style={{ fontSize: 22, fontFamily: fonts.monoSemiBold, color: clay.text, letterSpacing: -0.5 }}>{formatCurrency(debtStatus.total_debt)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, fontFamily: fonts.body, color: clay.textMuted }}>Pago mensual</Text>
                <Text style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: accent.amberDark }}>{formatCurrency(debtStatus.total_monthly_payment)}</Text>
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
                <Ionicons name="trending-up" size={16} color={accent.water} />
                <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: clay.text }}>Ingresos vs Egresos</Text>
              </View>
              <ClayLineChart
                labels={last6.map(m => MONTHS_SHORT[m.month - 1])}
                datasets={[
                  { data: last6.map(m => Number(m.income)), color: accent.water },
                  { data: last6.map(m => Number(m.expenses)), color: accent.coral },
                ]}
                legend={['Ingresos', 'Egresos']}
              />
            </ClayCard>
          )
        })()}

        {/* Monthly evolution list */}
        {monthlyData?.data && (
          <ClayCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Ionicons name="stats-chart" size={16} color={accent.water} />
              <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: clay.text }}>Evolución mensual</Text>
            </View>
            {monthlyData.data.slice(-4).reverse().map((m, i, arr) => {
              const isPositive = m.net >= 0
              return (
                <View key={m.month} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: clay.border }}>
                  <Text style={{ fontSize: 14, fontFamily: fonts.bodySemiBold, color: clay.text }}>{getMonthName(m.month)}</Text>
                  <View style={{
                    backgroundColor: isPositive ? colors.success[50] : colors.danger[50],
                    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                    flexDirection: 'row', alignItems: 'center', gap: 3,
                  }}>
                    <Ionicons name={isPositive ? 'caret-up' : 'caret-down'} size={12} color={isPositive ? colors.success[500] : colors.danger[500]} />
                    <Text style={{ fontSize: 14, fontFamily: fonts.monoSemiBold, color: isPositive ? colors.success[500] : colors.danger[500] }}>
                      {formatCurrency(Math.abs(Number(m.net)))}
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

function StatTile({ label, value, icon, tint, bg }) {
  return (
    <View style={{ flex: 1, backgroundColor: clay.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: clay.border, ...shadow.sm }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text style={{ fontSize: 12, fontFamily: fonts.bodyMedium, color: clay.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 17, fontFamily: fonts.monoSemiBold, color: clay.text, letterSpacing: -0.3, marginTop: 2 }}>{value}</Text>
    </View>
  )
}
