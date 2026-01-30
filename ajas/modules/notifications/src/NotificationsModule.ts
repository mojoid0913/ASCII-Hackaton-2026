import { NativeModule, requireNativeModule } from 'expo';

import { NotificationsModuleEvents } from './Notifications.types';

declare class NotificationsModule extends NativeModule<NotificationsModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NotificationsModule>('Notifications');
