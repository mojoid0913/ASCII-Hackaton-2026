import type { StyleProp, ViewStyle } from 'react-native';

// 알림 데이터 타입
export type NotificationData = {
  eventType: 'posted' | 'removed' | 'active';
  id: number;
  key: string;
  packageName: string;
  postTime: number;
  isClearable: boolean;
  isOngoing: boolean;
  title: string | null;
  text: string | null;
  subText: string | null;
  bigText: string | null;
  infoText: string | null;
  summaryText: string | null;
  category: string | null;
  group: string | null;
  channelId: string | null;
  tag: string | null;
};

// 리스너 상태 변경 이벤트 페이로드
export type ListenerStatusPayload = {
  isListening: boolean;
  hasPermission: boolean;
};

// 모듈 이벤트 타입
export type NotificationsModuleEvents = {
  onNotificationPosted: (data: NotificationData) => void;
  onNotificationRemoved: (data: NotificationData) => void;
  onListenerStatusChanged: (data: ListenerStatusPayload) => void;
};

// View 관련 타입 (레거시 지원용)
export type OnLoadEventPayload = {
  url: string;
};

export type NotificationsViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
