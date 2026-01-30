package expo.modules.notifications

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationsModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("Notifications")

    // Events that can be sent to JavaScript
    Events("onNotificationPosted", "onNotificationRemoved")

    // Check if notification listener permission is granted
    Function("isPermissionGranted") { isNotificationListenerEnabled() }

    // Check if listener service is currently connected
    Function("isListenerConnected") { NotificationListenerService.isConnected }

    // Open notification listener settings to request permission
    AsyncFunction("requestPermission") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    // Start listening to notifications (register callbacks)
    Function("startListening") {
      if (!isNotificationListenerEnabled()) {
        throw Exception("Notification listener permission not granted")
      }

      NotificationListenerService.onNotificationPosted = { data ->
        sendEvent(
                "onNotificationPosted",
                mapOf(
                        "id" to data.id,
                        "key" to data.key,
                        "packageName" to data.packageName,
                        "postTime" to data.postTime,
                        "title" to data.title,
                        "text" to data.text,
                        "subText" to data.subText,
                        "bigText" to data.bigText,
                        "category" to data.category,
                        "isOngoing" to data.isOngoing,
                        "isClearable" to data.isClearable
                )
        )
      }

      NotificationListenerService.onNotificationRemoved = { data ->
        sendEvent(
                "onNotificationRemoved",
                mapOf(
                        "id" to data.id,
                        "key" to data.key,
                        "packageName" to data.packageName,
                        "postTime" to data.postTime,
                        "title" to data.title,
                        "text" to data.text,
                        "subText" to data.subText,
                        "bigText" to data.bigText,
                        "category" to data.category,
                        "isOngoing" to data.isOngoing,
                        "isClearable" to data.isClearable
                )
        )
      }

      true
    }

    // Stop listening to notifications (unregister callbacks)
    Function("stopListening") {
      NotificationListenerService.onNotificationPosted = null
      NotificationListenerService.onNotificationRemoved = null
      true
    }

    // Get all currently active notifications
    AsyncFunction("getActiveNotifications") {
      if (!isNotificationListenerEnabled()) {
        throw Exception("Notification listener permission not granted")
      }

      val service =
              NotificationListenerService.instance
                      ?: throw Exception("Notification listener service not connected")

      service.getActiveNotificationsData().map { data ->
        mapOf(
                "id" to data.id,
                "key" to data.key,
                "packageName" to data.packageName,
                "postTime" to data.postTime,
                "title" to data.title,
                "text" to data.text,
                "subText" to data.subText,
                "bigText" to data.bigText,
                "category" to data.category,
                "isOngoing" to data.isOngoing,
                "isClearable" to data.isClearable
        )
      }
    }

    // Cancel a specific notification by key
    AsyncFunction("cancelNotification") { key: String ->
      if (!isNotificationListenerEnabled()) {
        throw Exception("Notification listener permission not granted")
      }

      val service =
              NotificationListenerService.instance
                      ?: throw Exception("Notification listener service not connected")

      service.cancelNotification(key)
      true
    }

    // Cancel all notifications
    AsyncFunction("cancelAllNotifications") {
      if (!isNotificationListenerEnabled()) {
        throw Exception("Notification listener permission not granted")
      }

      val service =
              NotificationListenerService.instance
                      ?: throw Exception("Notification listener service not connected")

      service.cancelAllNotifications()
      true
    }
  }

  private fun isNotificationListenerEnabled(): Boolean {
    val packageName = context.packageName
    val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")

    if (!TextUtils.isEmpty(flat)) {
      val names = flat.split(":").toTypedArray()
      for (name in names) {
        val cn = ComponentName.unflattenFromString(name)
        if (cn != null && TextUtils.equals(packageName, cn.packageName)) {
          return true
        }
      }
    }
    return false
  }
}
