import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { clay, colors } from './src/theme'

const tabs = [
  { name: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { name: 'Expenses', icon: 'trending-down-outline', activeIcon: 'trending-down' },
  { name: 'Incomes', icon: 'trending-up-outline', activeIcon: 'trending-up' },
  { name: 'Debts', icon: 'card-outline', activeIcon: 'card' },
  { name: 'Savings', icon: 'wallet-outline', activeIcon: 'wallet' },
  { name: 'Reports', icon: 'document-text-outline', activeIcon: 'document-text' },
  { name: 'Calculator', icon: 'calculator-outline', activeIcon: 'calculator' },
  { name: 'Projections', icon: 'eye-outline', activeIcon: 'eye' },
]

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = tabs.find(t => t.name === route.name)
        return {
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? tab?.activeIcon : tab?.icon}
              size={size}
              color={focused ? colors.danger[400] : colors.dark[400]}
            />
          ),
          tabBarActiveTintColor: colors.danger[400],
          tabBarInactiveTintColor: colors.dark[400],
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.3,
          },
          tabBarStyle: {
            backgroundColor: clay.card,
            borderTopWidth: 1,
            borderTopColor: clay.highlight,
            paddingTop: 4,
            paddingBottom: 6,
            height: 58,
            shadowColor: clay.shadow,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
          headerShown: false,
        }
      }}
    >
      {tabs.map(t => (
        <Tab.Screen key={t.name} name={t.name}
          getComponent={() => {
            const screens = {
              Dashboard: require('./src/screens/Dashboard').default,
              Expenses: require('./src/screens/Expenses').default,
              Incomes: require('./src/screens/Incomes').default,
              Debts: require('./src/screens/Debts').default,
              Savings: require('./src/screens/Savings').default,
              Reports: require('./src/screens/Reports').default,
              Calculator: require('./src/screens/Calculator').default,
              Projections: require('./src/screens/Projections').default,
            }
            return screens[t.name]
          }}
          listeners={({ navigation, route }) => ({
            tabPress: (e) => {
              if (route.name === 'Expenses' || route.name === 'Incomes') {
                // Force re-mount on every tab press to refresh data
              }
            },
          })}
        />
      ))}
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={require('./src/screens/Login').default} />
      <Stack.Screen name="Register" component={require('./src/screens/Register').default} />
    </Stack.Navigator>
  )
}

function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: clay.bg }}>
        <View style={{
          width: 64, height: 64, borderRadius: 20,
          backgroundColor: clay.card,
          justifyContent: 'center', alignItems: 'center',
          shadowColor: clay.shadow, shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
          marginBottom: 16,
        }}>
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
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  )
}
