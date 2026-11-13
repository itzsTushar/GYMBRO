
const ExerciseLibrary = {

  categories: [],

  init() {
    this.load();

    this.bindEvents();

    this.render();
  },

  // ----------------------------------
  // DEFAULT EXERCISE CATEGORIES
  // ----------------------------------

  getDefaults() {
    return [
      {
        id: "chest",
        name: "Chest",
        type: "strength",
        exercises: []
      },
      {
        id: "biceps",
        name: "Biceps",
        type: "strength",
        exercises: []
      },
      {
        id: "triceps",
        name: "Triceps",
        type: "strength",
        exercises: []
      },
      {
        id: "back",
        name: "Back",
        type: "strength",
        exercises: []
      },
      {
        id: "shoulders",
        name: "Shoulders",
        type: "strength",
        exercises: []
      },
      {
        id: "legs",
        name: "Legs",
        type: "strength",
        exercises: []
      },
      {
        id: "abs",
        name: "Abs",
        type: "strength",
        exercises: []
      },
      {
        id: "basic",
        name: "Basic Exercises",
        type: "bodyweight",
        exercises: [
          {
            id: "pushups",
            name: "Push-ups",
            weight: 0,
            reps: 15,
            sets: 3,
            notes: "Bodyweight exercise"
          },
          {
            id: "pullups",
            name: "Pull-ups",
            weight: 0,
            reps: 10,
            sets: 3,
            notes: "Bodyweight exercise"
          },
          {
            id: "squats",
            name: "Squats",
            weight: 0,
            reps: 15,
            sets: 3,
            notes: "Bodyweight exercise"
          }
        ]
      },
      {
        id: "cardio",
        name: "Cardio",
        type: "cardio",
        exercises: [
          {
            id: "running",
            name: "Running",
            duration: 20,
            distance: 2,
            notes: ""
          },
          {
            id: "cycling",
            name: "Cycling",
            duration: 30,
            distance: 5,
            notes: ""
          },
          {
            id: "treadmill",
            name: "Treadmill",
            duration: 20,
            distance: 2,
            notes: ""
          }
        ]
      }
    ];
  },

  // ----------------------------------
  // LOAD AND SAVE
  // ----------------------------------

  load() {

    const saved = Storage.getExercises();

    if (saved.length === 0) {
      this.categories = this.getDefaults();
      this.save();
    } else {
      this.categories = saved;
    }

  },

  save() {
    Storage.saveExercises(this.categories);
  },

  generateId() {
    return "ex_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 7);
  },

  // ----------------------------------
  // EVENT LISTENERS
  // ----------------------------------

  bindEvents() {

    document.getElementById("addCategoryBtn")
      .addEventListener("click", () => {
        this.openCategoryModal();
      });

    document.getElementById("addCardioBtn")
      .addEventListener("click", () => {
        this.openExerciseModal("cardio");
      });

    document.getElementById("closeExerciseModal")
      .addEventListener("click", () => this.closeExerciseModal());

    document.getElementById("cancelExercise")
      .addEventListener("click", () => this.closeExerciseModal());

    document.getElementById("closeCategoryModal")
      .addEventListener("click", () => this.closeCategoryModal());

    document.getElementById("cancelCategory")
      .addEventListener("click", () => this.closeCategoryModal());

    document.getElementById("exerciseForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveExercise();
      });

    document.getElementById("categoryForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.addCategory();
      });

    document.getElementById("exerciseSearch")
      .addEventListener("input", (e) => {
        this.render(e.target.value);
      });

    // Event delegation for dynamic buttons
    document.getElementById("exerciseLibrary")
      .addEventListener("click", (e) => {
        this.handleLibraryClick(e);
      });

    document.getElementById("cardioLibrary")
      .addEventListener("click", (e) => {
        this.handleLibraryClick(e);
      });

  },

  // ----------------------------------
  // CATEGORY MANAGEMENT
  // ----------------------------------

  openCategoryModal() {

    document.getElementById("categoryName").value = "";

    document.getElementById("categoryModal")
      .classList.add("show");

  },

  closeCategoryModal() {

    document.getElementById("categoryModal")
      .classList.remove("show");

  },

  addCategory() {

    const name = document.getElementById("categoryName")
      .value.trim();

    if (!name) return;

    const exists = this.categories.some(
      category => category.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      showToast("This category already exists.");
      return;
    }

    this.categories.push({
      id: this.generateId(),
      name: name,
      type: "strength",
      exercises: []
    });

    this.save();

    this.closeCategoryModal();

    this.render();

    showToast("Body part added successfully.");

  },

  deleteCategory(id) {

    const category = this.categories.find(c => c.id === id);

    if (!category) return;

    const confirmed = confirm(
      `Delete ${category.name} and all its exercises?`
    );

    if (!confirmed) return;

    this.categories = this.categories.filter(
      c => c.id !== id
    );

    this.save();

    this.render();

    showToast("Category deleted.");

  },

  // ----------------------------------
  // EXERCISE MODAL
  // ----------------------------------

  openExerciseModal(categoryId, exerciseId = null) {

    const category = this.categories.find(
      c => c.id === categoryId
    );

    if (!category) return;

    const exercise = exerciseId
      ? category.exercises.find(e => e.id === exerciseId)
      : null;

    document.getElementById("exerciseForm").reset();

    document.getElementById("exerciseCategoryId").value =
      categoryId;

    document.getElementById("editExerciseId").value =
      exerciseId || "";

    document.getElementById("modalTitle").textContent =
      exercise ? "Edit Exercise" : "Add Exercise";

    document.getElementById("exerciseName").value =
      exercise?.name || "";

    document.getElementById("exerciseWeight").value =
      exercise?.weight ?? "";

    document.getElementById("exerciseReps").value =
      exercise?.reps ?? "";

    document.getElementById("exerciseSets").value =
      exercise?.sets ?? "";

    document.getElementById("exerciseDuration").value =
      exercise?.duration ?? "";

    document.getElementById("exerciseDistance").value =
      exercise?.distance ?? "";

    document.getElementById("exerciseNotes").value =
      exercise?.notes || "";

    const isCardio = category.type === "cardio";

    document.getElementById("cardioFields")
      .classList.toggle("hidden", !isCardio);

    document.getElementById("strengthFields")
      .classList.toggle("hidden", isCardio);

    document.getElementById("weightGroup")
      .classList.toggle(
        "hidden",
        isCardio || category.type === "bodyweight"
      );

    document.getElementById("exerciseModal")
      .classList.add("show");

  },

  closeExerciseModal() {

    document.getElementById("exerciseModal")
      .classList.remove("show");

  },

  // ----------------------------------
  // ADD / UPDATE EXERCISE
  // ----------------------------------

  saveExercise() {

    const categoryId =
      document.getElementById("exerciseCategoryId").value;

    const exerciseId =
      document.getElementById("editExerciseId").value;

    const category = this.categories.find(
      c => c.id === categoryId
    );

    if (!category) return;

    const name = document.getElementById("exerciseName")
      .value.trim();

    if (!name) return;

    const isCardio = category.type === "cardio";

    const exercise = {

      id: exerciseId || this.generateId(),

      name,

      weight: isCardio || category.type === "bodyweight"
        ? 0
        : Number(document.getElementById("exerciseWeight").value) || 0,

      reps: isCardio
        ? 0
        : Number(document.getElementById("exerciseReps").value),

      sets: isCardio
        ? 0
        : Number(document.getElementById("exerciseSets").value),

      duration: isCardio
        ? Number(document.getElementById("exerciseDuration").value) || 0
        : 0,

      distance: isCardio
        ? Number(document.getElementById("exerciseDistance").value) || 0
        : 0,

      notes: document.getElementById("exerciseNotes").value.trim()

    };

    if (isCardio) {

      if (!exercise.duration && !exercise.distance) {
        showToast("Enter a duration or distance target.");
        return;
      }

    } else {

      if (!exercise.reps || !exercise.sets) {
        showToast("Enter repetitions and sets.");
        return;
      }

    }

    if (exerciseId) {

      const index = category.exercises.findIndex(
        e => e.id === exerciseId
      );

      if (index !== -1) {
        category.exercises[index] = exercise;
      }

    } else {

      category.exercises.push(exercise);

    }

    this.save();

    this.closeExerciseModal();

    this.render();

    showToast(
      exerciseId
        ? "Exercise updated."
        : "Exercise added successfully."
    );

  },

  // ----------------------------------
  // DELETE EXERCISE
  // ----------------------------------

  deleteExercise(categoryId, exerciseId) {

    const category = this.categories.find(
      c => c.id === categoryId
    );

    if (!category) return;

    if (!confirm("Delete this exercise?")) return;

    category.exercises = category.exercises.filter(
      e => e.id !== exerciseId
    );

    this.save();

    this.render();

    showToast("Exercise deleted.");

  },

  // ----------------------------------
  // COLLAPSIBLE CATEGORY TREE
  // ----------------------------------

  toggleCategory(id) {

    const element = document.getElementById(
      "category-body-" + id
    );

    const arrow = document.getElementById(
      "category-arrow-" + id
    );

    if (!element) return;

    element.classList.toggle("collapsed");

    arrow.textContent =
      element.classList.contains("collapsed") ? "＋" : "−";

  },

  // ----------------------------------
  // BUTTON EVENT HANDLING
  // ----------------------------------

  handleLibraryClick(event) {

    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;

    const categoryId = button.dataset.category;
    const exerciseId = button.dataset.exercise;

    if (action === "toggle") {
      this.toggleCategory(categoryId);
    }

    if (action === "add") {
      this.openExerciseModal(categoryId);
    }

    if (action === "edit") {
      this.openExerciseModal(categoryId, exerciseId);
    }

    if (action === "delete") {
      this.deleteExercise(categoryId, exerciseId);
    }

    if (action === "delete-category") {
      this.deleteCategory(categoryId);
    }

  },

  // ----------------------------------
  // EXERCISE CARD HTML
  // ----------------------------------

  createExerciseHTML(category, exercise) {

    const cardio = category.type === "cardio";

    let details = "";

    if (cardio) {

      details = `
        <span>${exercise.duration || 0} min</span>
        <span>${exercise.distance || 0} km</span>
      `;

    } else {

      if (category.type === "strength") {
        details += `<span>${exercise.weight} kg</span>`;
      }

      details += `
        <span>${exercise.reps} reps</span>
        <span>${exercise.sets} sets</span>
      `;

    }

    return `

      <div class="exercise-item">

        <div class="exercise-info">

          <div class="exercise-symbol">
            ${cardio ? "♡" : "✣"}
          </div>

          <div>

            <strong>${this.escapeHTML(exercise.name)}</strong>

            <div class="exercise-details">
              ${details}
            </div>

            ${
              exercise.notes
                ? `<p class="exercise-note">${this.escapeHTML(exercise.notes)}</p>`
                : ""
            }

          </div>

        </div>

        <div class="exercise-actions">

          <button
            class="small-icon-btn"
            data-action="edit"
            data-category="${category.id}"
            data-exercise="${exercise.id}"
            title="Edit exercise"
          >✎</button>

          <button
            class="small-icon-btn delete-action"
            data-action="delete"
            data-category="${category.id}"
            data-exercise="${exercise.id}"
            title="Delete exercise"
          >×</button>

        </div>

      </div>

    `;

  },

  // ----------------------------------
  // RENDER CATEGORY TREE
  // ----------------------------------

  render(search = "") {

    const normalLibrary =
      document.getElementById("exerciseLibrary");

    const cardioLibrary =
      document.getElementById("cardioLibrary");

    const searchText = search.toLowerCase();

    const strengthCategories = this.categories.filter(
      category => category.type !== "cardio"
    );

    const cardioCategories = this.categories.filter(
      category => category.type === "cardio"
    );

    let totalExercises = 0;

    const renderCategory = (category) => {

      const exercises = category.exercises.filter(
        exercise =>
          exercise.name.toLowerCase().includes(searchText)
      );

      if (searchText && exercises.length === 0 &&
          !category.name.toLowerCase().includes(searchText)) {
        return "";
      }

      totalExercises += exercises.length;

      return `

        <article class="category-card">

          <div class="category-heading">

            <button
              class="category-toggle"
              data-action="toggle"
              data-category="${category.id}"
            >

              <span class="category-symbol">
                ${category.type === "cardio" ? "♡" : "♧"}
              </span>

              <span class="category-name">
                ${this.escapeHTML(category.name)}
              </span>

              <span class="category-count">
                ${exercises.length} exercises
              </span>

              <span
                class="category-arrow"
                id="category-arrow-${category.id}"
              >−</span>

            </button>

            <div class="category-actions">

              <button
                class="small-add-btn"
                data-action="add"
                data-category="${category.id}"
              >
                + Add exercise
              </button>

              ${
                !["chest","biceps","triceps","back",
                  "shoulders","legs","abs","basic","cardio"]
                  .includes(category.id)
                ? `
                  <button
                    class="small-icon-btn delete-action"
                    data-action="delete-category"
                    data-category="${category.id}"
                    title="Delete category"
                  >×</button>
                `
                : ""
              }

            </div>

          </div>

          <div
            class="category-body"
            id="category-body-${category.id}"
          >

            ${
              exercises.length
                ? exercises.map(exercise =>
                    this.createExerciseHTML(category, exercise)
                  ).join("")
                : `<div class="empty-category">
                    No exercises added yet. Click "Add exercise" to begin.
                   </div>`
            }

          </div>

        </article>

      `;

    };

    normalLibrary.innerHTML = strengthCategories
      .map(renderCategory)
      .join("");

    cardioLibrary.innerHTML = cardioCategories
      .map(renderCategory)
      .join("");

    document.getElementById("exerciseCount").textContent =
      `${totalExercises} exercises`;

  },

  // ----------------------------------
  // SAFE HTML TEXT
  // ----------------------------------

  escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);

  }

};

