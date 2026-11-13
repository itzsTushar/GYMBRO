/* GYMBRO LocalStorage helpers. Resetting history never touches library/settings. */
const GYMBRO_KEYS = {
  exercises: "gymbro_exercises",
  daily: "gymbro_daily_workouts",
  history: "gymbro_history",
  streaks: "gymbro_streaks",
  settings: "gymbro_settings",
  version: "gymbro_version"
};

const Storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.error("GYMBRO storage read error:", error);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("GYMBRO storage write error:", error);
      showToast("Could not save data in this browser.");
      return false;
    }
  },
  getDaily() { return this.get(GYMBRO_KEYS.daily, {}); },
  saveDaily(data) { return this.set(GYMBRO_KEYS.daily, data); },
  getSettings() { return this.get(GYMBRO_KEYS.settings, { reminderEnabled: true, reminderTime: "18:00" }); },
  saveSettings(settings) { return this.set(GYMBRO_KEYS.settings, settings); },
  getExercises() { return this.get(GYMBRO_KEYS.exercises, []); },
  saveExercises(exercises) { return this.set(GYMBRO_KEYS.exercises, exercises); },
  getHistory() { return this.get(GYMBRO_KEYS.history, {}); },
  saveHistory(history) { return this.set(GYMBRO_KEYS.history, history); },
  resetWorkoutHistory() {
    localStorage.removeItem(GYMBRO_KEYS.daily);
    localStorage.removeItem(GYMBRO_KEYS.history);
    localStorage.removeItem(GYMBRO_KEYS.streaks);
  }
};

(function initializeStorage() {
  if (!localStorage.getItem(GYMBRO_KEYS.version)) {
    localStorage.setItem(GYMBRO_KEYS.version, JSON.stringify(1));
  }
})();
