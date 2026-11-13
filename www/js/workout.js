const Workout = {

  init() {
    document.getElementById("addWorkoutExercise")
      .addEventListener("click", () => this.addSelectedExercise());

    document.getElementById("todayWorkoutList")
      .addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-set-index]");

        if (!checkbox) return;

        this.toggleSet(
          checkbox.dataset.itemId,
          Number(checkbox.dataset.setIndex),
          checkbox.checked
        );
      });

    document.getElementById("todayWorkoutList")
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-remove-item]");

        if (button) {
          this.removeItem(button.dataset.removeItem);
        }
      });

    this.render();
  },

  todayKey() {
    return Streak.dateKey(new Date());
  },

  getLibraryExercises() {
    const result = [];

    ExerciseLibrary.categories.forEach(category => {
      category.exercises.forEach(exercise => {
        result.push({ category, exercise });
      });
    });

    return result;
  },

  renderSelector() {
    const select = document.getElementById("workoutExerciseSelect");

    select.innerHTML =
      '<option value="">Choose an exercise</option>';

    const exercises = this.getLibraryExercises();

    exercises.forEach(({ category, exercise }) => {
      const option = document.createElement("option");

      option.value = `${category.id}::${exercise.id}`;

      option.textContent =
        `${category.name} — ${exercise.name}`;

      select.appendChild(option);
    });

    const empty = document.getElementById("workoutLibraryEmpty");

    empty.classList.toggle("hidden", exercises.length > 0);

    select.disabled = exercises.length === 0;

    document.getElementById("addWorkoutExercise").disabled =
      exercises.length === 0;
  },

  addSelectedExercise() {
    const select = document.getElementById("workoutExerciseSelect");

    if (!select.value) {
      showToast("Choose an exercise first.");
      return;
    }

    const [categoryId, exerciseId] = select.value.split("::");

    const found = this.getLibraryExercises().find(item =>
      item.category.id === categoryId &&
      item.exercise.id === exerciseId
    );

    if (!found) {
      showToast("Exercise not found.");
      this.renderSelector();
      return;
    }

    const { category, exercise } = found;

    const isCardio = category.type === "cardio";

    const sets = isCardio
      ? 1
      : Math.max(1, Number(exercise.sets) || 1);

    const daily = Storage.getDaily();

    const key = this.todayKey();

    const record = daily[key] || {
      items: []
    };

    if (!Array.isArray(record.items)) {
      record.items = [];
    }

    const item = {
      id: "day_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 7),

      libraryExerciseId: exercise.id,

      categoryId: category.id,

      categoryName: category.name,

      name: exercise.name,

      type: category.type,

      weight: Number(exercise.weight) || 0,

      reps: Number(exercise.reps) || 0,

      sets: sets,

      duration: Number(exercise.duration) || 0,

      distance: Number(exercise.distance) || 0,

      notes: exercise.notes || "",

      completedSets: Array(sets).fill(false)
    };

    record.items.push(item);

    this.recalculate(record);

    daily[key] = record;

    Storage.saveDaily(daily);

    select.value = "";

    this.render();

    this.refreshDashboard();

    showToast("Exercise added to today's workout.");
  },

  toggleSet(itemId, setIndex, checked) {
    const daily = Storage.getDaily();

    const key = this.todayKey();

    const record = daily[key];

    if (!record || !Array.isArray(record.items)) return;

    const item = record.items.find(entry =>
      entry.id === itemId
    );

    if (!item) return;

    if (!Array.isArray(item.completedSets)) {
      item.completedSets = Array(item.sets).fill(false);
    }

    item.completedSets[setIndex] = checked;

    this.recalculate(record);

    daily[key] = record;

    Storage.saveDaily(daily);

    this.renderProgress(record);

    this.refreshDashboard();
  },

  removeItem(itemId) {
    const confirmed = confirm(
      "Remove this exercise from today's workout?"
    );

    if (!confirmed) return;

    const daily = Storage.getDaily();

    const key = this.todayKey();

    const record = daily[key];

    if (!record || !Array.isArray(record.items)) return;

    record.items = record.items.filter(item =>
      item.id !== itemId
    );

    if (record.items.length === 0) {
      delete daily[key];
    } else {
      this.recalculate(record);
      daily[key] = record;
    }

    Storage.saveDaily(daily);

    this.render();

    this.refreshDashboard();

    showToast("Exercise removed.");
  },

  recalculate(record) {
    let totalSets = 0;
    let completedSets = 0;

    record.items.forEach(item => {
      const sets = Math.max(1, Number(item.sets) || 1);

      if (!Array.isArray(item.completedSets)) {
        item.completedSets = Array(sets).fill(false);
      }

      while (item.completedSets.length < sets) {
        item.completedSets.push(false);
      }

      item.completedSets =
        item.completedSets.slice(0, sets);

      totalSets += sets;

      completedSets +=
        item.completedSets.filter(Boolean).length;
    });

    record.totalSets = totalSets;

    record.completedSets = completedSets;

    record.completed =
      totalSets > 0 && completedSets === totalSets;

    record.summary = record.completed
      ? `${record.items.length} exercises completed`
      : `${completedSets} of ${totalSets} sets completed`;
  },

  render() {
    this.renderSelector();

    const daily = Storage.getDaily();

    const record = daily[this.todayKey()];

    const holder =
      document.getElementById("todayWorkoutList");

    if (!record || !record.items || record.items.length === 0) {

      holder.innerHTML = `
        <div class="workout-empty">
          <div class="placeholder-icon">＋</div>
          <h3>No exercises planned yet</h3>
          <p>Add exercises from your exercise library.</p>
        </div>
      `;

      this.renderProgress(null);

      return;
    }

    holder.innerHTML = record.items.map(item => {

      const isCardio = item.type === "cardio";

      const details = isCardio
        ? `${item.duration} min · ${item.distance} km`
        : `${item.weight ? item.weight + " kg · " : ""}${item.reps} reps · ${item.sets} sets`;

      const checkboxes = Array.from(
        { length: item.sets },
        (_, index) => {

          const completed =
            Boolean(item.completedSets?.[index]);

          return `
            <label class="workout-set ${completed ? "is-done" : ""}">

              <input
                type="checkbox"
                data-item-id="${item.id}"
                data-set-index="${index}"
                ${completed ? "checked" : ""}
              >

              <span>
                ${isCardio ? "Complete cardio target" : "Set " + (index + 1)}
              </span>

            </label>
          `;
        }
      ).join("");

      return `
        <article class="workout-item">

          <div class="workout-item-top">

            <div>
              <span class="workout-category">
                ${this.escape(item.categoryName)}
              </span>

              <h3>${this.escape(item.name)}</h3>

              <p class="workout-item-detail">
                ${this.escape(details)}
              </p>

              ${
                item.notes
                  ? `<p class="workout-item-notes">${this.escape(item.notes)}</p>`
                  : ""
              }

            </div>

            <button
              type="button"
              class="small-icon-btn delete-action"
              data-remove-item="${item.id}"
              title="Remove exercise"
            >×</button>

          </div>

          <div class="workout-sets">
            ${checkboxes}
          </div>

        </article>
      `;

    }).join("");

    this.renderProgress(record);
  },

  renderProgress(record) {
    const percent = record && record.totalSets
      ? Math.round(
          (record.completedSets / record.totalSets) * 100
        )
      : 0;

    document.getElementById("workoutProgressPercent")
      .textContent = percent + "%";

    document.getElementById("workoutProgressCount")
      .textContent =
        `${record?.completedSets || 0} of ${record?.totalSets || 0} sets`;

    document.getElementById("workoutProgressBar")
      .style.width = percent + "%";

    document.getElementById("workoutProgressStatus")
      .textContent = record?.completed
        ? "Workout completed"
        : record?.totalSets
          ? "In progress"
          : "Not started";
  },

  refreshDashboard() {
    App.updateDashboard();

    if (
      document.getElementById("page-history")
        .classList.contains("active")
    ) {
      App.renderHistory();
    }
  },

  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

};
