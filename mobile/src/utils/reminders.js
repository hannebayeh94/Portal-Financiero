import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { formatCurrency } from './formatters'

const CHANNEL_ID = 'reminders'

// Muestra la notificación aunque la app esté en primer plano.
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6D54E8',
  })
}

export async function requestPermission() {
  const settings = await Notifications.getPermissionsAsync()
  if (settings.granted || settings.ios?.status === 3) return true
  const req = await Notifications.requestPermissionsAsync()
  return req.granted || req.ios?.status === 3
}

// Próxima fecha (a las 9:00) para un día del mes dado.
function nextMonthlyDate(day, from = new Date()) {
  const d = Math.min(Math.max(parseInt(day, 10) || 1, 1), 28)
  const candidate = new Date(from.getFullYear(), from.getMonth(), d, 9, 0, 0)
  if (candidate.getTime() <= from.getTime()) candidate.setMonth(candidate.getMonth() + 1)
  return candidate
}

// Próxima ocurrencia según tipo de recurrencia, tomando el día de `dateStr`.
function nextRecurringDate(dateStr, recurrenceType, from = new Date()) {
  const base = dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)
    ? new Date(...dateStr.split('T')[0].split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))))
    : new Date()
  if (recurrenceType === 'weekly') {
    const target = new Date(from)
    target.setHours(9, 0, 0, 0)
    const diff = (base.getDay() - target.getDay() + 7) % 7
    target.setDate(target.getDate() + (diff === 0 ? 7 : diff))
    return target
  }
  if (recurrenceType === 'yearly') {
    const candidate = new Date(from.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0)
    if (candidate.getTime() <= from.getTime()) candidate.setFullYear(candidate.getFullYear() + 1)
    return candidate
  }
  // monthly (por defecto)
  return nextMonthlyDate(base.getDate(), from)
}

async function scheduleAt(date, title, body) {
  if (!date || date.getTime() <= Date.now()) return
  await Notifications.scheduleNotificationAsync({
    content: { title, body, ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  })
}

// Reagenda TODOS los recordatorios (se llama al abrir/volver a la app).
// Al usar triggers de fecha única y reprogramar cada vez, se mantienen frescos.
export async function scheduleAllReminders({ debts = [], recurringExpenses = [], recurringIncomes = [] }) {
  await Notifications.cancelAllScheduledNotificationsAsync()
  let count = 0

  for (const d of debts) {
    if (d.status && d.status !== 'active') continue
    const day = d.payment_day || (d.start_date ? new Date(d.start_date).getDate() : null)
    if (!day) continue
    const date = nextMonthlyDate(day)
    await scheduleAt(date, '💳 Pago de deuda', `${d.name}: cuota de ${formatCurrency(d.monthly_payment)} el día ${date.getDate()}.`)
    count++
  }

  for (const e of recurringExpenses) {
    const date = nextRecurringDate(e.date, e.recurrence_type)
    await scheduleAt(date, '🔔 Egreso recurrente', `${e.description}: ${formatCurrency(e.amount)}.`)
    count++
  }

  for (const i of recurringIncomes) {
    const date = nextRecurringDate(i.date, i.recurrence_type)
    await scheduleAt(date, '🔔 Ingreso recurrente', `${i.description}: ${formatCurrency(i.amount)}.`)
    count++
  }

  return count
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

// Notificación de prueba a los ~3 segundos (para verificar permisos/canal).
export async function sendTestReminder() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Recordatorio de prueba',
      body: 'Así se verán tus recordatorios de vencimientos y pagos recurrentes.',
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
  })
}
