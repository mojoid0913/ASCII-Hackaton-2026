package expo.modules.notifications

import android.app.Notification
import android.content.Intent
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotificationListenerServiceImpl : NotificationListenerService() {
    
    companion object {
        private const val TAG = "NotificationListener"
        
        // 싱글톤 인스턴스로 서비스 접근
        var instance: NotificationListenerServiceImpl? = null
            private set
        
        // 알림 이벤트를 전달할 리스너
        var notificationCallback: NotificationCallback? = null
    }
    
    interface NotificationCallback {
        fun onNotificationPosted(notificationData: Map<String, Any?>)
        fun onNotificationRemoved(notificationData: Map<String, Any?>)
    }
    
    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.d(TAG, "NotificationListenerService created")
    }
    
    override fun onDestroy() {
        super.onDestroy()
        instance = null
        Log.d(TAG, "NotificationListenerService destroyed")
    }
    
    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "NotificationListenerService connected")
    }
    
    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "NotificationListenerService disconnected")
    }
    
    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn?.let {
            Log.d(TAG, "Notification posted: ${it.packageName}")
            val data = extractNotificationData(it, "posted")
            notificationCallback?.onNotificationPosted(data)
        }
    }
    
    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        sbn?.let {
            Log.d(TAG, "Notification removed: ${it.packageName}")
            val data = extractNotificationData(it, "removed")
            notificationCallback?.onNotificationRemoved(data)
        }
    }
    
    private fun extractNotificationData(sbn: StatusBarNotification, eventType: String): Map<String, Any?> {
        val notification = sbn.notification
        val extras = notification.extras
        
        return mapOf(
            "eventType" to eventType,
            "id" to sbn.id,
            "key" to sbn.key,
            "packageName" to sbn.packageName,
            "postTime" to sbn.postTime,
            "isClearable" to sbn.isClearable,
            "isOngoing" to sbn.isOngoing,
            "title" to extras.getCharSequence(Notification.EXTRA_TITLE)?.toString(),
            "text" to extras.getCharSequence(Notification.EXTRA_TEXT)?.toString(),
            "subText" to extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString(),
            "bigText" to extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString(),
            "infoText" to extras.getCharSequence(Notification.EXTRA_INFO_TEXT)?.toString(),
            "summaryText" to extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT)?.toString(),
            "category" to notification.category,
            "group" to notification.group,
            "channelId" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) notification.channelId else null,
            "tag" to sbn.tag
        )
    }
    
    /**
     * 현재 활성화된 모든 알림을 가져옴
     */
    fun getActiveNotifications(): List<Map<String, Any?>> {
        return try {
            activeNotifications?.map { extractNotificationData(it, "active") } ?: emptyList()
        } catch (e: Exception) {
            Log.e(TAG, "Error getting active notifications", e)
            emptyList()
        }
    }
    
    /**
     * 특정 알림을 dismiss
     */
    fun dismissNotification(key: String) {
        try {
            cancelNotification(key)
        } catch (e: Exception) {
            Log.e(TAG, "Error dismissing notification", e)
        }
    }
    
    /**
     * 모든 알림을 dismiss
     */
    fun dismissAllNotifications() {
        try {
            cancelAllNotifications()
        } catch (e: Exception) {
            Log.e(TAG, "Error dismissing all notifications", e)
        }
    }
}
