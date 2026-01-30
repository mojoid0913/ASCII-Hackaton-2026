import { Component, ReactNode } from "react";
import { Notifications } from "react-native-notifications";

export type NotificationListenerProps = {};

class NotificationListener extends Component {
  constructor(props: NotificationListenerProps) {
    super(props);
    console.log("Registering for notifications....");

    Notifications.registerRemoteNotifications();

    Notifications.events().registerNotificationReceivedForeground(
      (notification, completion) => {
        console.log(
          `Notification received in foreground: ${notification.title} : ${notification.body}`,
        );
        completion({ alert: false, sound: false, badge: false });
      },
    );

    Notifications.events().registerNotificationOpened(
      (notification, completion) => {
        console.log(`Notification opened: ${notification.payload}`);
        completion();
      },
    );
  }

  render(): ReactNode {
    return null;
  }
}

export default NotificationListener;
