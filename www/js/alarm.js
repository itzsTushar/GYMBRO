/* Native Android daily reminder using Capacitor Local Notifications. */
const Alarm = {
  notificationId: 481516,
  webTimer: null,
  init() {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) this.checkWebFallback();
    });
    this.checkWebFallback();
    this.webTimer = setInterval(() => this.checkWebFallback(), 5000);
    if (this.isNative()) {
      this.schedule(Storage.getSettings()).catch(error => console.warn("GYMBRO reminder setup:", error));
    }
  },
  isNative() {
    return Boolean(window.Capacitor?.isNativePlatform?.() && window.GYMBROLocalNotifications);
  },
  async schedule(settings) {
    if (this.isNative()) {
      const plugin = window.GYMBROLocalNotifications;
      await plugin.cancel({ notifications: [{ id: this.notificationId }] });
      if (!settings.reminderEnabled) return;
      const permission = await plugin.requestPermissions();
      if (permission.display !== "granted") throw new Error("Notification permission denied");
      await plugin.createChannel({
        id: "gymbro-workout-reminders",
        name: "Workout reminders",
        description: "Daily GYMBRO workout reminder",
        importance: 5,
        sound: "gymbro_reminder",
        vibration: true,
        visibility: 1
      });
      const [hour, minute] = (settings.reminderTime || "18:00").split(":").map(Number);
      const result = await plugin.schedule({
        notifications: [{
          id: this.notificationId,
          title: "GYMBRO — Workout Reminder",
          body: "It's time for your scheduled workout. Let's get moving!",
          channelId: "gymbro-workout-reminders",
          schedule: { on: { hour, minute }, allowWhileIdle: true },
          isExactNotification: true,
          ongoing: false,
          autoCancel: true
        }]
      });
      if (result?.warning) console.warn("Exact alarm warning:", result.warning.message);
      return;
    }
    if ("Notification" in window && settings.reminderEnabled && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    this.checkWebFallback();
  },
  checkWebFallback() {
    if (this.isNative()) return;
    const settings = Storage.getSettings();
    if (!settings.reminderEnabled || !settings.reminderTime || document.hidden) return;
    const now = new Date();
    const current = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const today = Streak.dateKey(now);
    if (current !== settings.reminderTime || localStorage.getItem("gymbro_last_alarm") === today) return;
    localStorage.setItem("gymbro_last_alarm", today);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("GYMBRO — Workout Reminder", { body: "It's time for your scheduled workout!", tag: "gymbro-workout-reminder" });
    }
    showToast("It's workout time!");
  }
};
