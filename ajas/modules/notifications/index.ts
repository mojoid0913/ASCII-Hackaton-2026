// Reexport the native module. On web, it will be resolved to NotificationsModule.web.ts
// and on native platforms to NotificationsModule.ts
export { default } from "./src/NotificationsModule";
export * from "./src/Notifications.types";
