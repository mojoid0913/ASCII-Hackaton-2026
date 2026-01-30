package expo.modules.notifications

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationsModule : Module(), NotificationListenerServiceImpl.NotificationCallback {
  
  private var isListening = false

  override fun definition() = ModuleDefinition {
    Name("Notifications")

    // 이벤트 정의
    Events(
      "onNotificationPosted",
      "onNotificationRemoved",
      "onListenerStatusChanged"
    )

    // 알림 리스너 권한이 있는지 확인
    Function("hasNotificationListenerPermission") {
      hasNotificationListenerPermission()
    }

    // 알림 리스너 설정 화면으로 이동
    Function("openNotificationListenerSettings") {
      openNotificationListenerSettings()
    }

    // 알림 리스닝 시작
    Function("startListening") {
      startListening()
    }

    // 알림 리스닝 중지
    Function("stopListening") {
      stopListening()
    }

    // 현재 활성화된 알림 목록 가져오기
    AsyncFunction("getActiveNotifications") {
      getActiveNotifications()
    }

    // 특정 알림 dismiss
    AsyncFunction("dismissNotification") { key: String ->
      dismissNotification(key)
    }

    // 모든 알림 dismiss
    AsyncFunction("dismissAllNotifications") {
      dismissAllNotifications()
    }

    // 리스닝 중인지 확인
    Function("isListening") {
      isListening && NotificationListenerServiceImpl.instance != null
    }

    OnStartObserving {
      startListening()
    }

    OnStopObserving {
      stopListening()
    }
  }

  private fun hasNotificationListenerPermission(): Boolean {
    val context = appContext.reactContext ?: return false
    val packageName = context.packageName
    val flat = Settings.Secure.getString(
      context.contentResolver,
      "enabled_notification_listeners"
    )
    return flat?.contains(packageName) == true
  }

  private fun openNotificationListenerSettings() {
    val context = appContext.reactContext ?: return
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
  }

  private fun startListening(): Boolean {
    if (!hasNotificationListenerPermission()) {
      return false
    }
    
    NotificationListenerServiceImpl.notificationCallback = this
    isListening = true
    
    sendEvent("onListenerStatusChanged", mapOf(
      "isListening" to true,
      "hasPermission" to true
    ))
    
    return true
  }

  private fun stopListening() {
    NotificationListenerServiceImpl.notificationCallback = null
    isListening = false
    
    sendEvent("onListenerStatusChanged", mapOf(
      "isListening" to false,
      "hasPermission" to hasNotificationListenerPermission()
    ))
  }

  private fun getActiveNotifications(): List<Map<String, Any?>> {
    val service = NotificationListenerServiceImpl.instance
    return service?.getActiveNotifications() ?: emptyList()
  }

  private fun dismissNotification(key: String) {
    NotificationListenerServiceImpl.instance?.dismissNotification(key)
  }

  private fun dismissAllNotifications() {
    NotificationListenerServiceImpl.instance?.dismissAllNotifications()
  }

  // NotificationCallback 구현
  override fun onNotificationPosted(notificationData: Map<String, Any?>) {
    if (isListening) {
      sendEvent("onNotificationPosted", notificationData)
    }
  }

  override fun onNotificationRemoved(notificationData: Map<String, Any?>) {
    if (isListening) {
      sendEvent("onNotificationRemoved", notificationData)
    }
  }
}
