import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Incomes from './pages/Incomes'
import Expenses from './pages/Expenses'
import Debts from './pages/Debts'
import DebtDetail from './pages/DebtDetail'
import Savings from './pages/Savings'
import SavingsDetail from './pages/SavingsDetail'
import Calculator from './pages/Calculator'
import DebtPayoff from './pages/DebtPayoff'
import Projections from './pages/Projections'
import Reports from './pages/Reports'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return user ? <Navigate to="/" /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="incomes" element={<Incomes />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="debts" element={<Debts />} />
        <Route path="debts/:id" element={<DebtDetail />} />
        <Route path="savings" element={<Savings />} />
        <Route path="savings/:id" element={<SavingsDetail />} />
        <Route path="calculator" element={<Calculator />} />
        <Route path="debt-payoff" element={<DebtPayoff />} />
        <Route path="projections" element={<Projections />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}
