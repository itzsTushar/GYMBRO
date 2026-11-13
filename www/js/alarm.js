
/* GYMBRO Phase 6 - Alarm Engine */

const Alarm = {
  timer: null,
  audioContext: null,
  oscillator: null,
  gainNode: null,
  soundTimer: null,
  ringing: false,
  unlocked: false,

  init() {
    this.createOverlay();

    document.addEventListener("pointerdown", () => {
      this.unlock();
    }, { once: true });

    this.timer = setInterval(() => {
      this.check();
    }, 5000);

    this.check();
  },

  createOverlay() {
    if (document.getElementById("alarmOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "alarmOverlay";
    overlay.className = "alarm-overlay";

    overlay.innerHTML = `
      <div class="alarm-card">
        <div class="alarm-icon">⏰</div>
        <p class="eyebrow">GYMBRO REMINDER</p>
        <h2>Time to work out!</h2>
        <p>Your scheduled workout reminder is here.</p>
        <button id="stopAlarm" class="primary-btn">
          Stop Alarm
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("stopAlarm")
      .addEventListener("click", () => this.stop());
  },

  unlock() {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!this.audioContext) {
      this.audioContext = new AudioContextClass();
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.unlocked = true;
  },

  check() {
    if (this.ringing) return;

    const settings = Storage.getSettings();

    if (!settings.reminderEnabled) return;

    if (!settings.reminderTime) return;

    const now = new Date();

    const currentTime =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");

    const today =
      now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");

    if (currentTime !== settings.reminderTime) return;

    if (localStorage.getItem("gymbro_last_alarm") === today) {
      return;
    }

    localStorage.setItem("gymbro_last_alarm", today);

    this.start();
  },

  start() {
    this.ringing = true;

    document.getElementById("alarmOverlay")
      .classList.add("active");

    this.playSound();

    if ("Notification" in window &&
        Notification.permission === "granted") {
      new Notification("GYMBRO - Workout Reminder", {
        body: "It's time for your scheduled workout!",
        tag: "gymbro-workout-reminder"
      });
    }

    if (navigator.vibrate) {
      navigator.vibrate([500, 300, 500, 300, 1000]);
    }
  },

 async playSound() {
    this.unlock();

    if (!this.audioContext ||
        this.audioContext.state !== "running") {
      return;
    }

    this.oscillator =
      this.audioContext.createOscillator();

    this.gainNode =
      this.audioContext.createGain();

    this.oscillator.type = "sine";
    this.oscillator.frequency.value = 880;

    this.gainNode.gain.value = 0;

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.oscillator.start();

    let high = false;

    this.soundTimer = setInterval(() => {
      if (!this.gainNode || !this.audioContext) return;

      high = !high;

      const now = this.audioContext.currentTime;

      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setTargetAtTime(
        high ? 0.18 : 0,
        now,
        0.03
      );
    }, 450);
  },

  stop() {
    this.ringing = false;

    document.getElementById("alarmOverlay")
      .classList.remove("active");

    clearInterval(this.soundTimer);
    this.soundTimer = null;

    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (error) {}

      this.oscillator.disconnect();
      this.oscillator = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  }
};

