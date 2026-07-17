import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { colors } from './src/theme'

import Login from './src/screens/Login'
import Register from './src/screens/Register'
import Dashboard from './src/screens/Dashboard'
import Expenses from './src/screens/Expenses'
import Incomes from './src/screens/Incomes'
import Debts from './src/screens/Debts'
import Savings from './src/screens/Savings'
import Reports from './src/screens/Reports'
import Calculator from './src/screens/Calculator'
import Projections from './src/screens/Projections'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const tabIcons = {
  Dashboard: '📊',
  Expenses: '📉',
  Incomes: '📈',
  Debts: '💳',
  Savings: '🏦',
  Reports: '📋',
  Calculator: '🧮',
  Projections: '🔮',
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ size }) => (
          <Text style={{ fontSize: size - 4 }}>{tabIcons[route.name] || '●'}</Text>
        ),
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.dark[400],
        tabBarStyle: {
          backgroundColor: colors.clay.card,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.6)',
          paddingVertical: 4,
          height: 60,
          shadowColor: colors.clay.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Expenses" component={Expenses} />
      <Tab.Screen name="Incomes" component={Incomes} />
      <Tab.Screen name="Debts" component={Debts} />
      <Tab.Screen name="Savings" component={Savings} />
      <Tab.Screen name="Reports" component={Reports} />
      <Tab.Screen name="Calculator" component={Calculator} />
      <Tab.Screen name="Projections" component={Projections} />
    </Tab.Navigator>
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0e8dc' }}>
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
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  )
}
