const Calendar = {
  visibleDate: new Date(),
  render(daily) {
    const year = this.visibleDate.getFullYear();
    const month = this.visibleDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    document.getElementById("monthLabel").textContent =
      this.visibleDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const holder = document.getElementById("calendarDays");
    holder.innerHTML = "";

    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement("div");
      blank.className = "calendar-day empty";
      holder.appendChild(blank);
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const status = Streak.dayStatus(date, daily, today);
      const cell = document.createElement("div");
      cell.className = `calendar-day ${status}`;
      if (status === "completed") {
        cell.innerHTML = '<span aria-label="Workout completed" title="Workout completed">✣</span>';
      } else {
        cell.textContent = day;
        if (status === "missed") cell.title = "Missed required workout";
        if (status === "optional") cell.title = "Optional Saturday";
        if (status === "rest") cell.title = "Sunday rest day";
        if (status === "today") cell.title = "Today";
      }
      holder.appendChild(cell);
    }
  },
  changeMonth(offset, daily) {
    this.visibleDate = new Date(this.visibleDate.getFullYear(), this.visibleDate.getMonth() + offset, 1);
    this.render(daily);
  }
};
