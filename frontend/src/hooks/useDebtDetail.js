import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

/**
 * Detalle de deuda: datos + proyección + ciclos de facturación en un hook.
 * Las mutaciones invalidan ['debts'] (lista, detalle y reportes derivados).
 */
export function useDebtDetail(id, { onError } = {}) {
  const qc = useQueryClient()

  const results = useQueries({
    queries: [
      { queryKey: ['debts', id], queryFn: () => api.get(`/debts/${id}`).then((r) => r.data) },
      { queryKey: ['debts', id, 'projection'], queryFn: () => api.get(`/debts/${id}/projection`).then((r) => r.data) },
      { queryKey: ['debts', id, 'cycles'], queryFn: () => api.get(`/debts/${id}/cycles`).then((r) => r.data) },
    ],
  })

  const [debtQ, projectionQ, cyclesQ] = results

  const invalidateAll = () => qc.invalidateQueries({ queryKey: ['debts'] })
  const fail = (msg) => {
    if (onError) onError(msg)
    else console.error(msg)
  }

  const addPayment = useMutation({
    mutationFn: (payload) => api.post(`/debts/${id}/payments`, payload),
    onSuccess: invalidateAll,
    onError: () => fail('Error al registrar pago'),
  })

  const updatePayment = useMutation({
    mutationFn: ({ paymentId, payload }) => api.put(`/debts/${id}/payments/${paymentId}`, payload),
    onSuccess: invalidateAll,
    onError: () => fail('Error al actualizar pago'),
  })

  const deletePayment = useMutation({
    mutationFn: (paymentId) => api.delete(`/debts/${id}/payments/${paymentId}`),
    onSuccess: invalidateAll,
    onError: () => fail('Error al eliminar pago'),
  })

  const addCharge = useMutation({
    mutationFn: (payload) => api.post(`/debts/${id}/charges`, payload),
    onSuccess: invalidateAll,
    onError: () => fail('Error al registrar consumo'),
  })

  return {
    debt: debtQ.data,
    projection: projectionQ.data,
    cyclesData: cyclesQ.data,
    loading: debtQ.isLoading || projectionQ.isLoading || cyclesQ.isLoading,
    error: results.find((r) => r.isError)?.error || null,
    addPayment,
    updatePayment,
    deletePayment,
    addCharge,
    invalidateAll,
  }
}

export function useUpdateDebt(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.put(`/debts/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })
}

export function useDeleteDebtById() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/debts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })
}
