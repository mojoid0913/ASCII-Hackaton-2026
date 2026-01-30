package expo.modules.notifications

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class NotificationListenerService : NotificationListenerService() {
    companion object {
        private const val TAG = "NotificationListener"

        // API endpoint for message analysis
        var apiEndpoint: String = "http://10.0.2.2:8000" // Default for Android emulator

        // Target package names to analyze (e.g., KakaoTalk, Samsung Messages)
        var targetPackageNames: Set<String> =
                setOf("com.kakao.talk", "com.samsung.android.messaging")

        // Listener callbacks
        var onNotificationPosted: ((NotificationData) -> Unit)? = null
        var onNotificationRemoved: ((NotificationData) -> Unit)? = null

        // Service instance for checking connection status
        var instance: expo.modules.notifications.NotificationListenerService? = null
            private set

        val isConnected: Boolean
            get() = instance != null
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val httpClient =
            OkHttpClient.Builder()
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .build()

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

            // Only analyze notifications from target packages
            if (targetPackageNames.contains(data.packageName)) {
                Log.d(TAG, "Target package detected, analyzing: ${data.packageName}")
                // Analyze the notification in background
                serviceScope.launch {
                    val analyzedData = analyzeNotification(data)
                    onNotificationPosted?.invoke(analyzedData)
                }
            } else {
                Log.d(TAG, "Skipping non-target package: ${data.packageName}")
                // Still emit the event but without analysis
                onNotificationPosted?.invoke(data)
            }
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

    private suspend fun analyzeNotification(data: NotificationData): NotificationData {
        return try {
            val content = data.bigText.ifEmpty { data.text }
            if (content.isEmpty()) {
                Log.d(TAG, "No content to analyze for notification ${data.id}")
                return data
            }

            val requestJson =
                    JSONObject().apply {
                        put("sender", data.title)
                        put("content", content)
                    }

            val requestBody =
                    requestJson
                            .toString()
                            .toRequestBody("application/json; charset=utf-8".toMediaType())

            val request = Request.Builder().url("$apiEndpoint/analyze").post(requestBody).build()

            Log.d(TAG, "Sending analyze request to $apiEndpoint/analyze")

            val response = httpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: ""

            if (response.isSuccessful) {
                val json = JSONObject(responseBody)
                val analyzed =
                        AnalyzedData(
                                isSuccessful = true,
                                riskScore = json.optInt("risk_score", 0),
                                reason = json.optString("reason", ""),
                                message = json.optString("message", "")
                        )
                Log.d(TAG, "Analysis successful: risk_score=${analyzed.riskScore}")
                data.copy(analyzed = analyzed)
            } else {
                Log.e(TAG, "Analysis failed: ${response.code} - $responseBody")
                val analyzed =
                        AnalyzedData(
                                isSuccessful = false,
                                code = response.code.toString(),
                                message = responseBody
                        )
                data.copy(analyzed = analyzed)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error analyzing notification", e)
            val analyzed =
                    AnalyzedData(
                            isSuccessful = false,
                            code = "NETWORK_ERROR",
                            message = e.message ?: "Unknown error"
                    )
            data.copy(analyzed = analyzed)
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
                isClearable = sbn.isClearable,
                analyzed = null
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

data class AnalyzedData(
        val isSuccessful: Boolean,
        val riskScore: Int? = null,
        val reason: String? = null,
        val message: String? = null,
        val code: String? = null
)

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
        val isClearable: Boolean,
        val analyzed: AnalyzedData? = null
)
