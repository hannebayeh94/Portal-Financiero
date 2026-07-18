package expo.modules.notificationlistener

import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationListenerModule : Module() {
  private val service = NotificationListenerService

  override fun definition() = ModuleDefinition {
    Name("NotificationListener")

    Events("onPaymentDetected")

    OnStartObserving("onPaymentDetected") {
      service.onPaymentDetected = { payment ->
        sendEvent("onPaymentDetected", payment)
      }
    }

    OnStopObserving("onPaymentDetected") {
      service.onPaymentDetected = null
    }

    Function("isListening") {
      service.instance != null
    }

    AsyncFunction("getDetectedPayments") {
      service.instance?.getDetectedPayments() ?: emptyList<Map<String, String>>()
    }

    Function("clearDetectedPayments") {
      service.instance?.clearPayments()
    }

    Function("openNotificationSettings") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }
  }
}
