/* Streak policy:
   Mon-Fri = required workout days. A missed required day breaks the streak.
   Saturday = optional: completion adds one; skipping is neutral.
   Sunday = rest day: always neutral.
   Today is never marked missed until the day has ended.
*/
const Streak = {
  dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },
  isCompleted(date, daily) {
    return Boolean(daily[this.dateKey(date)]?.completed);
  },
  calculate(daily, today = new Date()) {
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayKey = this.dateKey(cursor);
    let current = 0;
    let highest = 0;
    let running = 0;

    // Calculate historical best up to yesterday, then current streak including today if completed.
    const start = new Date(cursor);
    start.setDate(start.getDate() - 3650);
    for (let d = new Date(start); d <= cursor; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const completed = this.isCompleted(d, daily);
      const isToday = this.dateKey(d) === todayKey;

      if (day === 0) continue; // Sunday is a rest day.
      if (day === 6) {
        if (completed) running += 1; // Saturday skipped = neutral.
      } else if (completed) {
        running += 1;
      } else if (!isToday) {
        running = 0; // Past Monday-Friday with no completion = broken streak.
      }
      highest = Math.max(highest, running);
    }

    // Current streak is the running streak after processing through today.
    current = running;
    return { current, highest };
  },
  dayStatus(date, daily, today = new Date()) {
    const key = this.dateKey(date);
    const completed = Boolean(daily[key]?.completed);
    const isToday = key === this.dateKey(today);
    const day = date.getDay();
    if (completed) return "completed";
    if (isToday) return "today";
    if (date > new Date(today.getFullYear(), today.getMonth(), today.getDate())) return "future";
    if (day === 0) return "rest";
    if (day === 6) return "optional";
    return "missed";
  }
};
