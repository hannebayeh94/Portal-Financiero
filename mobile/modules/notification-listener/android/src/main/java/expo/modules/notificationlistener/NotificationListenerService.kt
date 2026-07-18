package expo.modules.notificationlistener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class NotificationListenerService : android.service.notification.NotificationListenerService() {
  companion object {
    const val PREFS_KEY = "detected_payments"
    const val PREFS_NAME = "notification_payments"
    var instance: NotificationListenerService? = null
    var onPaymentDetected: ((Map<String, String>) -> Unit)? = null
  }

  override fun onCreate() {
    super.onCreate()
    instance = this
  }

  override fun onDestroy() {
    instance = null
    super.onDestroy()
  }

  override fun onNotificationPosted(sbn: android.service.notification.StatusBarNotification) {
    val notification = sbn.notification
    val extras = notification.extras ?: return
    val title = extras.getString(android.app.Notification.EXTRA_TITLE) ?: ""
    val text = extras.getString(android.app.Notification.EXTRA_TEXT) ?: ""
    val bigText = extras.getString(android.app.Notification.EXTRA_BIG_TEXT) ?: ""
    val subText = extras.getString(android.app.Notification.EXTRA_SUB_TEXT) ?: ""

    val fullText = "$title $text $bigText $subText"
    val parsed = parsePayment(fullText) ?: return

    savePayment(parsed)
    onPaymentDetected?.invoke(parsed)
  }

  override fun onNotificationRemoved(sbn: android.service.notification.StatusBarNotification?) {}

  private fun parsePayment(text: String): Map<String, String>? {
    val patterns = listOf(
      Regex("""pagaste\s*\$?\s*([\d.,]+)\s*en\s*(.+)""", RegexOption.IGNORE_CASE),
      Regex("""compra\s+de\s*\$?\s*([\d.,]+)\s*en\s*(.+)""", RegexOption.IGNORE_CASE),
      Regex("""consumo\s+de\s*\$?\s*([\d.,]+)\s*en\s*(.+)""", RegexOption.IGNORE_CASE),
      Regex("""cargo\s+de\s*\$?\s*([\d.,]+)\s*(?:en|por|a)\s*(.+)""", RegexOption.IGNORE_CASE),
      Regex("""\$?\s*([\d.,]+)\s*(?:en|por)\s*(.{3,30})""", RegexOption.IGNORE_CASE),
    )

    for (pattern in patterns) {
      val match = pattern.find(text)
      if (match != null) {
        val rawAmount = match.groupValues[1].replace(",", "").replace(".", "").trim()
        val amount = rawAmount.toDoubleOrNull() ?: continue
        val merchant = match.groupValues[2].trim().take(50)
        return mapOf(
          "amount" to amount.toString(),
          "merchant" to merchant,
          "source" to "notification",
          "raw" to text.take(200)
        )
      }
    }
    return null
  }

  private fun savePayment(payment: Map<String, String>) {
    val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val existing = prefs.getString(PREFS_KEY, "[]") ?: "[]"
    val arr = org.json.JSONArray(existing)
    val obj = org.json.JSONObject(payment)
    obj.put("detected_at", System.currentTimeMillis())
    arr.put(obj)
    prefs.edit().putString(PREFS_KEY, arr.toString()).apply()
  }

  fun getDetectedPayments(): List<Map<String, String>> {
    val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(PREFS_KEY, "[]") ?: "[]"
    val arr = org.json.JSONArray(raw)
    val result = mutableListOf<Map<String, String>>()
    for (i in 0 until arr.length()) {
      val obj = arr.getJSONObject(i)
      result.add(obj.keys().asSequence().associateWith { obj.getString(it) })
    }
    return result
  }

  fun clearPayments() {
    getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().putString(PREFS_KEY, "[]").apply()
  }
}
