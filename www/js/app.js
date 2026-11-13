function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}


const App = {

  init() {

    this.bindNavigation();

    this.bindCalendar();

    this.bindReminder(); 
    Alarm.init();

    this.bindReset();

    ExerciseLibrary.init();

    Workout.init();

    this.updateDashboard();

    this.updateHeaderDate();

    this.updateReminderUI();

    document.getElementById("mobileMenu")
      .addEventListener("click", () => {
        document.getElementById("sidebar")
          .classList.toggle("open");
      });

    document.addEventListener("click", (event) => {

      const go = event.target.closest("[data-go]");

      if (go) {
        this.navigate(go.dataset.go);
      }

    });

  },


  bindNavigation() {

    document.querySelectorAll(".nav-link")
      .forEach(button => {

        button.addEventListener("click", () => {
          this.navigate(button.dataset.page);
        });

      });

  },


  navigate(page) {

    document.querySelectorAll(".page-view")
      .forEach(view => view.classList.remove("active"));

    document.getElementById(`page-${page}`)
      ?.classList.add("active");

    document.querySelectorAll(".nav-link")
      .forEach(link => {

        link.classList.toggle(
          "active",
          link.dataset.page === page
        );

      });

    const active = document.querySelector(
      `.nav-link[data-page="${page}"]`
    );

    document.getElementById("pageTitle").textContent =
      active ? active.textContent.trim() : "Dashboard";

    document.getElementById("sidebar")
      .classList.remove("open");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    if (page === "history") {
      this.renderHistory();
    }

    if (page === "exercises" || page === "cardio") {
      ExerciseLibrary.render(
        document.getElementById("exerciseSearch").value
      );
    }

    if (page === "workout") {
      Workout.render();
    }

  },


  bindCalendar() {

    document.getElementById("prevMonth")
      .addEventListener("click", () => {
        Calendar.changeMonth(-1, Storage.getDaily());
      });

    document.getElementById("nextMonth")
      .addEventListener("click", () => {
        Calendar.changeMonth(1, Storage.getDaily());
      });

  },



bindReminder() {
  document.getElementById("saveReminder")
    .addEventListener("click", async () => {

      const settings = {
        reminderEnabled:
          document.getElementById("reminderEnabled").checked,

        reminderTime:
          document.getElementById("reminderTime").value || "18:00"
      };

      Storage.saveSettings(settings);

      Alarm.unlock();

      this.updateReminderUI();

      if (
        settings.reminderEnabled &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        await Notification.requestPermission();
      }

      Alarm.check();

      showToast("Reminder settings saved.");
    });
},


  bindReset() {

    document.getElementById("resetHistory")
      .addEventListener("click", () => {

        const confirmed = window.confirm(
          "Reset workout history, daily progress and streak statistics? Your exercise library and settings will be preserved."
        );

        if (!confirmed) return;

        Storage.resetWorkoutHistory();

        this.updateDashboard();

        this.renderHistory();

        Workout.render();

        showToast("Workout history has been reset.");

      });

  },


  updateHeaderDate() {

    const now = new Date();

    document.getElementById("topDate").textContent =
      now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      }).toUpperCase();

    const hour = now.getHours();

    document.getElementById("greeting").textContent =
      hour < 12
        ? "GOOD MORNING"
        : hour < 17
          ? "GOOD AFTERNOON"
          : "GOOD EVENING";

  },


  updateDashboard() {

    const daily = Storage.getDaily();

    const streak = Streak.calculate(daily);

    const todayKey = Streak.dateKey(new Date());

    const todayRecord = daily[todayKey];

    const last30 = this.getLast30Days(daily);

    document.getElementById("currentStreak").innerHTML =
      `${streak.current} <small>days</small>`;

    document.getElementById("highestStreak").innerHTML =
      `${streak.highest} <small>days</small>`;

    document.getElementById("workoutDays").innerHTML =
      `${last30.filter(x => x.completed).length} <small>days</small>`;

    Calendar.render(daily);

    this.renderRecentSummary(last30);

    if (todayRecord && todayRecord.totalSets > 0) {

      document.getElementById("progressEmpty")
        .classList.add("hidden");

      document.getElementById("progressContent")
        .classList.remove("hidden");

      const percent = Math.round(
        (todayRecord.completedSets / todayRecord.totalSets) * 100
      );

      document.getElementById("progressPercent").textContent =
        `${percent}%`;

      document.getElementById("progressCount").textContent =
        `${todayRecord.completedSets} of ${todayRecord.totalSets} sets`;

      document.getElementById("progressBar").style.width =
        `${percent}%`;

      document.getElementById("todayStatus").textContent =
        todayRecord.completed ? "Completed" : "In progress";

    } else {

      document.getElementById("progressEmpty")
        .classList.remove("hidden");

      document.getElementById("progressContent")
        .classList.add("hidden");

      document.getElementById("todayStatus").textContent =
        "Not started";

    }

    this.updateReminderUI();

  },


  getLast30Days(daily) {

    const result = [];

    const today = new Date();

    for (let i = 29; i >= 0; i--) {

      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - i
      );

      const key = Streak.dateKey(date);

      result.push({

        date,

        key,

        completed: Boolean(daily[key]?.completed),

        record: daily[key] || null,

        status: Streak.dayStatus(date, daily, today)

      });

    }

    return result;

  },


  renderRecentSummary(days) {

    const completed =
      days.filter(x => x.completed).length;

    const missed =
      days.filter(x => x.status === "missed").length;

    const optional =
      days.filter(x => x.status === "optional").length;

    document.getElementById("recentSummary").innerHTML = `

      <div class="recent-box">
        <strong>${completed}</strong>
        <span>Completed workout days</span>
      </div>

      <div class="recent-box">
        <strong>${missed}</strong>
        <span>Missed mandatory days</span>
      </div>

      <div class="recent-box">
        <strong>${optional}</strong>
        <span>Optional Saturdays skipped</span>
      </div>

    `;

  },


  renderHistory() {

    const days =
      this.getLast30Days(Storage.getDaily()).reverse();

    const holder =
      document.getElementById("historyList");

    holder.innerHTML = "";

    days.forEach(item => {

      const row = document.createElement("div");

      row.className = "history-row";

      const dateText = item.date.toLocaleDateString(
        "en-IN",
        {
          weekday: "short",
          day: "numeric",
          month: "short"
        }
      );

      let label = "Rest day";

      let cls = "status-rest";

      let detail = "Sunday";

      if (item.completed) {

        label = "Completed";

        cls = "status-complete";

        detail = item.record?.summary || "Workout completed";

      } else if (item.status === "missed") {

        label = "Missed";

        cls = "status-missed";

        detail = "No workout recorded";

      } else if (item.status === "optional") {

        label = "Optional";

        cls = "status-rest";

        detail = "Saturday – no streak impact";

      } else if (item.status === "future") {

        label = "Upcoming";

        cls = "status-rest";

        detail = "Not yet recorded";

      } else if (item.status === "today") {

        label = "Today";

        cls = "status-rest";

        detail = "Workout not completed yet";

      }

      row.innerHTML = `

        <span class="history-date">${dateText}</span>

        <span class="history-detail">${detail}</span>

        <span class="status-pill ${cls}">
          ${label}
        </span>

      `;

      holder.appendChild(row);

    });

  },


  updateReminderUI() {

    const settings = Storage.getSettings();

    document.getElementById("reminderEnabled").checked =
      settings.reminderEnabled;

    document.getElementById("reminderTime").value =
      settings.reminderTime;

    const [hours, minutes] =
      settings.reminderTime.split(":").map(Number);

    const suffix = hours >= 12 ? "PM" : "AM";

    const displayHour = hours % 12 || 12;

    document.getElementById("reminderValue").innerHTML =
      `${displayHour}:${String(minutes).padStart(2, "0")} <small>${suffix}</small>`;

  }

};


document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
