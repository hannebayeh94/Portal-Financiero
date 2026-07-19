import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { NotificationProvider } from './src/context/NotificationContext'
import { RemindersProvider } from './src/context/RemindersContext'
import DialogProvider from './src/components/ConfirmDialog'
import { clay, colors } from './src/theme'

import Login from './src/screens/Login'
import Register from './src/screens/Register'
import Dashboard from './src/screens/Dashboard'
import Expenses from './src/screens/Expenses'
import Incomes from './src/screens/Incomes'
import MoreScreen from './src/screens/MoreScreen'
import Debts from './src/screens/Debts'
import DebtDetail from './src/screens/DebtDetail'
import Savings from './src/screens/Savings'
import SavingsDetail from './src/screens/SavingsDetail'
import Reports from './src/screens/Reports'
import Calculator from './src/screens/Calculator'
import Projections from './src/screens/Projections'
import PaymentsHistory from './src/screens/PaymentsHistory'
import Budgets from './src/screens/Budgets'
import Reminders from './src/screens/Reminders'
import AutoExpenseModal from './src/components/AutoExpenseModal'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const MoreStack = createNativeStackNavigator()

const tabConfig = [
  { name: 'Dashboard', label: 'Inicio', icon: 'grid-outline', activeIcon: 'grid' },
  { name: 'Expenses', label: 'Egresos', icon: 'trending-down-outline', activeIcon: 'trending-down' },
  { name: 'Incomes', label: 'Ingresos', icon: 'trending-up-outline', activeIcon: 'trending-up' },
  { name: 'Más', label: 'Más', icon: 'ellipsis-horizontal-circle-outline', activeIcon: 'ellipsis-horizontal-circle' },
]

function MoreStackScreen() {
  return (
    <MoreStack.Navigator>
      <MoreStack.Screen name="MoreMain" component={MoreScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="Debts" component={Debts} options={{ headerShown: false }} />
      <MoreStack.Screen name="DebtDetail" component={DebtDetail} options={{ headerShown: false }} />
      <MoreStack.Screen name="Savings" component={Savings} options={{ headerShown: false }} />
      <MoreStack.Screen name="SavingsDetail" component={SavingsDetail} options={{ headerShown: false }} />
      <MoreStack.Screen name="Reports" component={Reports} options={{ headerShown: false }} />
      <MoreStack.Screen name="Calculator" component={Calculator} options={{ headerShown: false }} />
      <MoreStack.Screen name="Projections" component={Projections} options={{ headerShown: false }} />
      <MoreStack.Screen name="Budgets" component={Budgets} options={{ headerShown: false }} />
      <MoreStack.Screen name="Reminders" component={Reminders} options={{ headerShown: false }} />
      <MoreStack.Screen name="PaymentsHistory" component={PaymentsHistory} options={{ headerShown: false }} />
    </MoreStack.Navigator>
  )
}

function MainTabs() {
  const insets = useSafeAreaInsets()
  return (
    <NotificationProvider>
    <RemindersProvider>
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = tabConfig.find(t => t.name === route.name)
        return {
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? tab?.activeIcon : tab?.icon}
              size={size}
              color={focused ? colors.primary[500] : colors.dark[400]}
            />
          ),
          tabBarLabel: tab?.label || route.name,
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: colors.dark[400],
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
          tabBarStyle: {
            backgroundColor: clay.card, borderTopWidth: 1, borderTopColor: clay.border,
            paddingTop: 4, paddingBottom: 6 + insets.bottom, height: 58 + insets.bottom,
            shadowColor: clay.shadow, shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
          },
          headerShown: false,
        }
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Expenses" component={Expenses} />
      <Tab.Screen name="Incomes" component={Incomes} />
      <Tab.Screen name="Más" component={MoreStackScreen} />
    </Tab.Navigator>
      <AutoExpenseModal />
    </RemindersProvider>
    </NotificationProvider>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  )
}

function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: clay.bg }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: clay.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6, marginBottom: 16 }}>
          <Text style={{ fontSize: 28 }}>💰</Text>
        </View>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <DialogProvider>
          <RootNavigator />
        </DialogProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
