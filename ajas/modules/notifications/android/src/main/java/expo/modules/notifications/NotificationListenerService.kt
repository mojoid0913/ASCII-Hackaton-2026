package expo.modules.notifications

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotificationListenerService : NotificationListenerService() {
    companion object {
        private const val TAG = "NotificationListener"

        // Listener callbacks
        var onNotificationPosted: ((NotificationData) -> Unit)? = null
        var onNotificationRemoved: ((NotificationData) -> Unit)? = null

        // Service instance for checking connection status
        var instance: expo.modules.notifications.NotificationListenerService? = null
            private set

        val isConnected: Boolean
            get() = instance != null
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        instance = this
        Log.d(TAG, "Notification Listener connected")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        instance = null
        Log.d(TAG, "Notification Listener disconnected")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        sbn?.let { notification ->
            val data = extractNotificationData(notification)
            Log.d(TAG, "Notification posted: ${data.packageName}")
            onNotificationPosted?.invoke(data)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
        sbn?.let { notification ->
            val data = extractNotificationData(notification)
            Log.d(TAG, "Notification removed: ${data.packageName}")
            onNotificationRemoved?.invoke(data)
        }
    }

    private fun extractNotificationData(sbn: StatusBarNotification): NotificationData {
        val notification = sbn.notification
        val extras = notification.extras

        return NotificationData(
                id = sbn.id.toString(),
                key = sbn.key,
                packageName = sbn.packageName,
                postTime = sbn.postTime,
                title = extras.getCharSequence("android.title")?.toString() ?: "",
                text = extras.getCharSequence("android.text")?.toString() ?: "",
                subText = extras.getCharSequence("android.subText")?.toString() ?: "",
                bigText = extras.getCharSequence("android.bigText")?.toString() ?: "",
                category = notification.category ?: "",
                isOngoing = sbn.isOngoing,
                isClearable = sbn.isClearable
        )
    }

    fun getActiveNotificationsData(): List<NotificationData> {
        return try {
            activeNotifications?.map { extractNotificationData(it) } ?: emptyList()
        } catch (e: Exception) {
            Log.e(TAG, "Error getting active notifications", e)
            emptyList()
        }
    }
}

data class NotificationData(
        val id: String,
        val key: String,
        val packageName: String,
        val postTime: Long,
        val title: String,
        val text: String,
        val subText: String,
        val bigText: String,
        val category: String,
        val isOngoing: Boolean,
        val isClearable: Boolean
)
