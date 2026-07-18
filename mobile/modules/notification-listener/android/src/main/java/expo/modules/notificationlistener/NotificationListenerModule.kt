package expo.modules.notificationlistener

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Build
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

    // Chequeo real del permiso: consulta la lista de listeners habilitados en
    // Settings.Secure y verifica que nuestro componente este dentro. Es mas
    // fiable que isListening(), que solo es true una vez que el SO enlaza el servicio.
    Function("isNotificationAccessEnabled") {
      val context = appContext.reactContext ?: return@Function false
      val flat = Settings.Secure.getString(
        context.contentResolver,
        "enabled_notification_listeners"
      ) ?: return@Function false
      val expected = ComponentName(context, NotificationListenerService::class.java)
      flat.split(":").any {
        val cn = ComponentName.unflattenFromString(it)
        cn != null && cn == expected
      }
    }

    AsyncFunction("getDetectedPayments") {
      service.instance?.getDetectedPayments() ?: emptyList<Map<String, String>>()
    }

    Function("clearDetectedPayments") {
      service.instance?.clearPayments()
    }

    // Abre la pantalla de acceso a notificaciones. En API 30+ hace deep-link
    // directo al detalle de nuestra app; con fallback a la lista general.
    Function("openNotificationSettings") {
      appContext.reactContext?.let { context ->
        val opened = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          try {
            val component = ComponentName(context, NotificationListenerService::class.java)
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
              .putExtra(
                Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME,
                component.flattenToString()
              )
              .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            true
          } catch (e: Exception) {
            false
          }
        } else {
          false
        }

        if (!opened) {
          val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          context.startActivity(intent)
        }
      }
    }

    // Abre la ficha de la app, donde vive el menu (tres puntos) con la opcion
    // "Permitir ajustes restringidos" que Android 13+ exige para APKs sideloaded.
    Function("openAppDetailsSettings") {
      appContext.reactContext?.let { context ->
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
          .setData(Uri.fromParts("package", context.packageName, null))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }
  }
}
