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

  // Normaliza montos con formato colombiano y anglosajon:
  //  "6.200" -> 6200   "1,800,000" -> 1800000   "33.899,00" -> 33899   "34.000,00" -> 34000
  private fun parseAmount(raw: String): Double? {
    var s = raw.trim().replace(Regex("[^0-9.,]"), "")
    if (s.isEmpty()) return null
    val hasDot = s.contains('.')
    val hasComma = s.contains(',')
    if (hasDot && hasComma) {
      // El separador decimal es el que aparece de ultimo
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        s = s.replace(".", "").replace(",", ".")   // formato CO: 33.899,00
      } else {
        s = s.replace(",", "")                       // formato US: 1,800.00
      }
    } else if (hasComma) {
      val parts = s.split(",")
      s = if (parts.size == 2 && parts[1].length == 2) s.replace(",", ".") else s.replace(",", "")
    } else if (hasDot) {
      val parts = s.split(".")
      if (!(parts.size == 2 && parts[1].length == 2)) s = s.replace(".", "")
    }
    return s.toDoubleOrNull()
  }

  private fun clean(s: String): String =
    s.trim().trim('.', ',', '-', ':').replace(Regex("\\s+"), " ").take(50).trim()

  private fun amountFrom(regex: Regex, text: String): Double? {
    val m = regex.find(text) ?: return null
    return parseAmount(m.groupValues[1])
  }

  private fun groupFrom(regex: Regex, text: String): String? {
    val m = regex.find(text) ?: return null
    val g = m.groupValues.getOrNull(1)?.let { clean(it) }
    return if (g.isNullOrEmpty()) null else g
  }

  private fun payment(amount: Double, description: String, kind: String, raw: String): Map<String, String> =
    mapOf(
      "amount" to amount.toString(),
      "merchant" to clean(description).ifEmpty { if (kind == "income") "Ingreso recibido" else "Pago" },
      "kind" to kind,
      "source" to "notification",
      "raw" to raw.take(200)
    )

  private fun parsePayment(text: String): Map<String, String>? {
    val lower = text.lowercase()

    // 1) Ignorar promociones / marketing
    val promoMarkers = listOf(
      "antes:", "antes $", "aplican t&c", "aplica t&c", "promo", "aprovecha",
      "tasas de inter", "tasa de inter", "rendir m", "descuento", "cupon", "cupón",
      "e.a.", "% e", "invita a", "gana ", "recompensa"
    )
    if (promoMarkers.any { lower.contains(it) }) return null

    // ---- INGRESOS ----
    // Nu: "Recibiste 34.000,00 en tu cuenta ... Te llego dinero de NOMBRE"
    amountFrom(Regex("""recibiste\s*(?:un pago de\s*)?\$?\s*([\d.,]+)""", RegexOption.IGNORE_CASE), text)?.let {
      val who = groupFrom(Regex("""dinero de\s+(.+?)(?:\s+con tu llave|\.|,|$)""", RegexOption.IGNORE_CASE), text)
        ?: groupFrom(Regex("""recibiste[^$]*?de\s+(.+?)(?:\s+con tu llave|\.|,|$)""", RegexOption.IGNORE_CASE), text)
      return payment(it, who ?: "Ingreso recibido", "income", text)
    }
    // Otros bancos: "Te consignaron $X", "Abono por $X"
    amountFrom(Regex("""(?:te\s+consignaron|abono(?:\s+por)?|consignaci[oó]n(?:\s+por)?)\s*\$?\s*([\d.,]+)""", RegexOption.IGNORE_CASE), text)?.let {
      return payment(it, "Ingreso recibido", "income", text)
    }

    // ---- EGRESOS ----
    // Nu: "Enviaste $25.000,00 ... Le enviaste a NOMBRE en su cuenta de BANCO"
    amountFrom(Regex("""enviaste\s*\$?\s*([\d.,]+)""", RegexOption.IGNORE_CASE), text)?.let {
      val who = groupFrom(Regex("""le enviaste a\s+(.+?)\s+en su cuenta""", RegexOption.IGNORE_CASE), text)
      return payment(it, who?.let { n -> "Envio a $n" } ?: "Transferencia enviada", "expense", text)
    }
    // Nu: "El pago de $33.899,00 a Movistar fue exitoso"
    Regex("""pago de\s*\$?\s*([\d.,]+)\s*a\s+(.+?)\s+fue exitoso""", RegexOption.IGNORE_CASE).find(text)?.let { m ->
      parseAmount(m.groupValues[1])?.let { return payment(it, m.groupValues[2], "expense", text) }
    }
    // Rappi: "Tu compra en Tiendas D1 por $ 6.200 fue exitosa"
    Regex("""compra en\s+(.+?)\s+por\s*\$?\s*([\d.,]+)""", RegexOption.IGNORE_CASE).find(text)?.let { m ->
      parseAmount(m.groupValues[2])?.let { return payment(it, m.groupValues[1], "expense", text) }
    }
    // Rappi: "El pago de tu RappiCard via PSE por $1,800,000 ..."
    Regex("""pago de tu\s+(\w+).*?por\s*\$?\s*([\d.,]+)""", RegexOption.IGNORE_CASE).find(text)?.let { m ->
      parseAmount(m.groupValues[2])?.let { return payment(it, "Pago ${m.groupValues[1]}", "expense", text) }
    }

    // ---- EGRESOS genericos (varios bancos) ----
    val expenseRules = listOf(
      Regex("""pagaste\s*\$?\s*([\d.,]+)\s*(?:en|a|por)\s+(.+)""", RegexOption.IGNORE_CASE),
      Regex("""compra(?:ste)?\s*(?:de|por)?\s*\$?\s*([\d.,]+)\s*(?:en|a)\s+(.+)""", RegexOption.IGNORE_CASE),
      Regex("""(?:consumo|cargo|retiro|compra)\s+(?:de|por)\s*\$?\s*([\d.,]+)\s*(?:en|por|a)\s+(.+)""", RegexOption.IGNORE_CASE),
      Regex("""pago(?:\s+por)?\s*\$?\s*([\d.,]+)\s*(?:en|a)\s+(.+)""", RegexOption.IGNORE_CASE),
    )
    for (r in expenseRules) {
      val m = r.find(text) ?: continue
      val amount = parseAmount(m.groupValues[1]) ?: continue
      return payment(amount, m.groupValues[2], "expense", text)
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
