import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

/**
 * Claves de caché centralizadas — usar en invalidateQueries tras mutaciones.
 * Deben espejar las de frontend/src/hooks/useFinanceQueries.js
 */
export const queryKeys = {
  monthlyEvolution: ['reports', 'monthly-evolution'],
  incomeSummary: ['incomes', 'summary'],
  expenseSummary: ['expenses', 'summary'],
  expensesByCategory: (month, year) => ['expenses', 'by-category', month, year],
  debtStatus: ['reports', 'debt-status'],
  savingsSummary: ['savings', 'summary'],
  expenses: (month, year) => ['expenses', 'list', { month, year }],
  incomes: (month, year) => ['incomes', 'list', { month, year }],
  categories: (type) => ['categories', { type }],
  debts: ['debts', 'list'],
  savings: ['savings'],
  budgets: (month, year) => ['budgets', { month, year }],
  insights: ['insights'],
}

const get = (url) => api.get(url).then((res) => res.data)

export function useMonthlyEvolution() {
  return useQuery({ queryKey: queryKeys.monthlyEvolution, queryFn: () => get('/reports/monthly-evolution') })
}

export function useIncomeSummary() {
  return useQuery({ queryKey: queryKeys.incomeSummary, queryFn: () => get('/incomes/summary') })
}

export function useExpenseSummary() {
  return useQuery({ queryKey: queryKeys.expenseSummary, queryFn: () => get('/expenses/summary') })
}

export function useDebtStatus() {
  return useQuery({ queryKey: queryKeys.debtStatus, queryFn: () => get('/reports/debt-status') })
}

export function useDashboardData() {
  const now = new Date()
  const results = useQueries({
    queries: [
      { queryKey: queryKeys.monthlyEvolution, queryFn: () => get('/reports/monthly-evolution') },
      { queryKey: queryKeys.incomeSummary, queryFn: () => get('/incomes/summary') },
      { queryKey: queryKeys.expenseSummary, queryFn: () => get('/expenses/summary') },
      { queryKey: queryKeys.debtStatus, queryFn: () => get('/reports/debt-status') },
      {
        queryKey: queryKeys.expensesByCategory(now.getMonth() + 1, now.getFullYear()),
        queryFn: () => get(`/expenses/by-category?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
      },
    ],
  })

  const [monthly, income, expense, debts, byCategory] = results

  return {
    loading: results.some((r) => r.isLoading),
    error: results.find((r) => r.isError)?.error || null,
    monthlyData: monthly.data,
    incomeSummary: income.data,
    expenseSummary: expense.data,
    debtStatus: debts.data,
    categoriesData: byCategory.data || [],
    refetchAll: () => Promise.all(results.map((r) => r.refetch())),
  }
}

/* ============ Egresos ============ */

export function useExpenses(month, year) {
  return useQuery({
    queryKey: queryKeys.expenses(month, year),
    queryFn: () => api.get('/expenses', { params: { month, year } }).then((res) => res.data),
  })
}

export function useCategories(type) {
  return useQuery({
    queryKey: queryKeys.categories(type),
    queryFn: () => api.get('/categories', { params: { type } }).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  })
}

function useInvalidate() {
  const qc = useQueryClient()
  return (keys) => Promise.all(keys.map((key) => qc.invalidateQueries({ queryKey: key })))
}

export function useSaveExpense() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? api.put(`/expenses/${id}`, payload) : api.post('/expenses', payload),
    onSuccess: () => invalidate([['expenses'], ['reports', 'monthly-evolution']]),
  })
}

export function useDeleteExpense() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => invalidate([['expenses'], ['reports', 'monthly-evolution']]),
  })
}

/* ============ Ingresos ============ */

export function useIncomes(month, year) {
  return useQuery({
    queryKey: queryKeys.incomes(month, year),
    queryFn: () => api.get('/incomes', { params: { month, year } }).then((res) => res.data),
  })
}

export function useSaveIncome() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? api.put(`/incomes/${id}`, payload) : api.post('/incomes', payload),
    onSuccess: () => invalidate([['incomes'], ['reports', 'monthly-evolution']]),
  })
}

export function useDeleteIncome() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id) => api.delete(`/incomes/${id}`),
    onSuccess: () => invalidate([['incomes'], ['reports', 'monthly-evolution']]),
  })
}

/* ============ Deudas ============ */

export function useDebts() {
  return useQuery({
    queryKey: queryKeys.debts,
    queryFn: () => get('/debts'),
  })
}

export function useSaveDebt() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? api.put(`/debts/${id}`, payload) : api.post('/debts', payload),
    onSuccess: () => invalidate([['debts'], ['reports']]),
  })
}

export function useDeleteDebt() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id) => api.delete(`/debts/${id}`),
    onSuccess: () => invalidate([['debts'], ['reports']]),
  })
}

/* ============ Ahorros ============ */

export function useSavings() {
  return useQuery({
    queryKey: queryKeys.savings,
    queryFn: () => get('/savings'),
  })
}

export function useSavingsSummary() {
  return useQuery({ queryKey: queryKeys.savingsSummary, queryFn: () => get('/savings/summary') })
}

export function useSaveSavings() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? api.put(`/savings/${id}`, payload) : api.post('/savings', payload),
    onSuccess: () => invalidate([queryKeys.savings]),
  })
}

export function useDeleteSavings() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id) => api.delete(`/savings/${id}`),
    onSuccess: () => invalidate([queryKeys.savings]),
  })
}

/* ============ Presupuestos ============ */

export function useBudgets(month, year) {
  return useQuery({
    queryKey: queryKeys.budgets(month, year),
    queryFn: () => api.get('/budgets', { params: { month, year } }).then((res) => res.data),
  })
}

export function useSaveBudget(month, year) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? api.put(`/budgets/${id}`, payload) : api.post('/budgets', payload),
    onSuccess: () => invalidate([['budgets']]),
  })
}

export function useDeleteBudget(month, year) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id) => api.delete(`/budgets/${id}`),
    onSuccess: () => invalidate([['budgets']]),
  })
}

/* ============ Detalle de deuda ============ */

export function useDebtDetail(id) {
  const results = useQueries({
    queries: [
      { queryKey: ['debts', id], queryFn: () => get(`/debts/${id}`) },
      { queryKey: ['debts', id, 'projection'], queryFn: () => get(`/debts/${id}/projection`) },
      { queryKey: ['debts', id, 'cycles'], queryFn: () => get(`/debts/${id}/cycles`) },
    ],
  })

  const [debtQ, projectionQ, cyclesQ] = results

  return {
    debt: debtQ.data,
    projection: projectionQ.data,
    cyclesData: cyclesQ.data,
    loading: debtQ.isLoading || !debtQ.data,
    error: debtQ.error,
  }
}

function useInvalidateDebts() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['debts'] })
}

export function useDebtMovements(id) {
  const invalidate = useInvalidateDebts()

  const addPayment = useMutation({
    mutationFn: (payload) => api.post(`/debts/${id}/payments`, payload),
    onSuccess: invalidate,
  })
  const addCharge = useMutation({
    mutationFn: (payload) => api.post(`/debts/${id}/charges`, payload),
    onSuccess: invalidate,
  })
  const updatePayment = useMutation({
    mutationFn: ({ paymentId, payload }) => api.put(`/debts/${id}/payments/${paymentId}`, payload),
    onSuccess: invalidate,
  })
  const deletePayment = useMutation({
    mutationFn: (paymentId) => api.delete(`/debts/${id}/payments/${paymentId}`),
    onSuccess: invalidate,
  })
  const removeDebt = useMutation({
    mutationFn: () => api.delete(`/debts/${id}`),
    onSuccess: invalidate,
  })

  return { addPayment, addCharge, updatePayment, deletePayment, removeDebt }
}

/* ============ Reportes ============ */

export function useInsights() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: () => get('/insights'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useProjections() {
  return useQuery({
    queryKey: ['projections'],
    queryFn: () => get('/projections'),
  })
}

export function useReportsData(year) {
  const results = useQueries({
    queries: [
      { queryKey: ['reports', 'cash-flow'], queryFn: () => get('/reports/cash-flow') },
      { queryKey: ['reports', 'monthly-evolution', year], queryFn: () => api.get('/reports/monthly-evolution', { params: { year } }).then((r) => r.data) },
      { queryKey: ['reports', 'debt-status'], queryFn: () => get('/reports/debt-status') },
      { queryKey: ['reports', 'savings-status'], queryFn: () => get('/reports/savings-status') },
    ],
  })

  const [cashFlow, monthly, debts, savings] = results

  return {
    loading: results.some((r) => r.isLoading),
    cashFlow: cashFlow.data,
    monthly,
    debtStatus: debts.data,
    savingsStatus: savings.data,
  }
}

/* ============ Detalle de cuenta de ahorro ============ */

export function useSavingsDetail(id) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['savings'] })

  const accountQuery = useQuery({
    queryKey: ['savings', id],
    queryFn: () => get(`/savings/${id}`),
  })

  const addTransaction = useMutation({
    mutationFn: (payload) => api.post(`/savings/${id}/transactions`, payload),
    onSuccess: invalidate,
  })
  const updateTransaction = useMutation({
    mutationFn: ({ transactionId, payload }) => api.put(`/savings/${id}/transactions/${transactionId}`, payload),
    onSuccess: invalidate,
  })
  const deleteTransaction = useMutation({
    mutationFn: (transactionId) => api.delete(`/savings/${id}/transactions/${transactionId}`),
    onSuccess: invalidate,
  })
  const updateAccount = useMutation({
    mutationFn: (payload) => api.put(`/savings/${id}`, payload),
    onSuccess: invalidate,
  })
  const removeAccount = useMutation({
    mutationFn: () => api.delete(`/savings/${id}`),
    onSuccess: invalidate,
  })

  return {
    account: accountQuery.data,
    loading: accountQuery.isLoading || !accountQuery.data,
    error: accountQuery.error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateAccount,
    removeAccount,
  }
}
