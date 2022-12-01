"use strict";

const hint = document.querySelector(".hint");
const manipulateWorkouts = document.querySelector(".manipulate-all--workouts");
const containerWorkouts = document.querySelector(".workouts");
const form = document.querySelector(".form");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const undoCreateBtn = document.querySelector(".undo-create");
const seeAllBtn = document.querySelector(".see-all--btn");
const deleteAllBtn = document.querySelector(".delete-all--btn");
const overlay = document.querySelector(".overlay");
const checkWindow = document.querySelector(".check-window");
const mapSpot = document.querySelector("#map");
const yesBtn = document.querySelector(".yes-btn");
const noBtn = document.querySelector(".no-btn");

let newForm;

class Workout {
  date = new Date();
  dateOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "long",
  };
  #id = Math.trunc(Math.random() * Number(10000000000000000n));

  constructor(coordinates, distance, duration) {
    this.coordinates = coordinates;
    this.distance = distance;
    this.duration = duration;
  }

  get id() {
    return this.#id;
  }

  _setDescription() {
    this.description = `${this.type.at(0).toUpperCase()}${this.type.slice(
      1
    )} on ${new Intl.DateTimeFormat(
      navigator.language,
      this.dateOptions
    ).format(this.date)}`;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration);
    this.cadence = cadence;
    this.calcPaces();
    this._setDescription();
  }

  calcPaces() {
    this.paces = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coordinates, distance, duration, ElevationGain) {
    super(coordinates, distance, duration);
    this.ElevationGain = ElevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

class App {
  #map;
  #mapZoom = 14;
  #mapEvent;
  #workouts = [];
  #markers = [];

  constructor() {
    this._getPosition();

    this._getLocalStorage();

    inputType.addEventListener("change", this._toggleWorkoutType);
    form.addEventListener("submit", this._createNewWorkout.bind(this));
    containerWorkouts.addEventListener(
      "click",
      this._goToClickedWorkoutOnMap.bind(this)
    );

    // seeAllBtn.addEventListener("click", this._seeAllWorkouts.bind(this));
    deleteAllBtn.addEventListener("click", this._deleteAllWorkouts.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._renderMap.bind(this),
        function () {
          alert("Sorry we could not find your current position!");
        }
      );
    }
  }

  _renderMap(position) {
    const { latitude, longitude } = position.coords;

    this.#map = L.map(mapSpot).setView([latitude, longitude], this.#mapZoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    if (this.#workouts.length === 0)
      hint.textContent =
        "Click at any spot on the map to create a new workout!";

    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((workout) => this._renderWorkoutOnMap(workout));
  }

  _showForm(mapClickEvent) {
    this.#mapEvent = mapClickEvent;
    hint.textContent = "";
    form.classList.remove("hidden");
    inputDistance.focus();
    undoCreateBtn.addEventListener("click", this._hideClearForm);
  }

  _toggleWorkoutType() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  showMessage(message, color) {
    hint.textContent = message;
    hint.style.color = color;
    return setTimeout(() => (hint.textContent = ""), 2000);
  }

  isAllInputsValid(...inputs) {
    return inputs.every((input) => Number.isFinite(input));
  }

  isSomeInputsEmpty(...inputs) {
    return inputs.some((input) => input === 0);
  }

  isAllInputsPossitive(...inputs) {
    return inputs.every((input) => input > 0);
  }

  _createNewWorkout(submitEvent) {
    submitEvent.preventDefault();

    const { lat: newLatitude, lng: newLongitude } = this.#mapEvent.latlng;
    const workoutType = inputType.value;
    const workoutDistance = +inputDistance.value;
    const workoutDuration = +inputDuration.value;

    let workout;

    if (workoutType === "running") {
      const workoutCadence = +inputCadence.value;
      if (
        !this.isAllInputsValid(workoutDistance, workoutDuration, workoutCadence)
      )
        return this.showMessage("All input have to be finite numbers!", "red");
      if (
        this.isSomeInputsEmpty(workoutDistance, workoutDuration, workoutCadence)
      )
        return this.showMessage("Please fill out all inputs!", "red");
      if (
        !this.isAllInputsPossitive(
          workoutDistance,
          workoutDuration,
          workoutCadence
        )
      )
        return this.showMessage(
          "All inputs have to be possitive numbers!",
          "red"
        );

      workout = new Running(
        [newLatitude, newLongitude],
        workoutDistance,
        workoutDuration,
        workoutCadence
      );
    }

    if (workoutType === "cycling") {
      const workoutElevationGain = +inputElevation.value;
      if (
        !this.isAllInputsValid(
          workoutDistance,
          workoutDuration,
          workoutElevationGain
        )
      )
        return this.showMessage("All input have to be finite numbers!", "red");
      if (
        this.isSomeInputsEmpty(
          workoutDistance,
          workoutDuration,
          workoutElevationGain
        )
      )
        return this.showMessage("Please fill out all inputs!", "red");
      if (!this.isAllInputsPossitive(workoutDistance, workoutDuration))
        return this.showMessage(
          "Distance and Elevation have to be possitive numbers!",
          "red"
        );

      workout = new Cycling(
        [newLatitude, newLongitude],
        workoutDistance,
        workoutDuration,
        workoutElevationGain
      );
    }

    this.showMessage("Workout successfully created!", "#00c46a");

    this.#workouts.push(workout);

    if (this.#workouts.length > 1)
      setTimeout(() => manipulateWorkouts.classList.remove("hidden"), 2000);

    this._hideClearForm();

    this._renderWorkoutOnMap(workout);

    this._renderWorkoutOnList(workout);

    this._setLocalStorage();
  }

  _hideClearForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    setTimeout(() => (form.style.display = "grid"), 300);
    form.classList.add("hidden");
  }

  _renderWorkoutOnMap(workout) {
    const marker = L.marker(workout.coordinates)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 300,
          className: `${workout.type}-popup`,
          autoClose: false,
          closeOnClick: false,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();

    this.#markers.push(marker);
  }

  _renderWorkoutOnList(workout) {
    let workoutElement = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
        }</span>
        <span class="workout__value distance-value">${workout.distance}</span>
        <span class="workout__unit">mile</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value duration-value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === "running")
      workoutElement += `
		<div class="workout__details">
		  <span class="workout__icon">⚡️</span>
		  <span class="workout__value paces-value">${workout.paces.toFixed(1)}</span>
		  <span class="workout__unit">min/mile</span>
		</div>
		<div class="workout__details">
		  <span class="workout__icon">🦶🏼</span>
		  <span class="workout__value cadence-value">${workout.cadence}</span>
		  <span class="workout__unit">spm</span>
		</div>
	  `;

    if (workout.type === "cycling")
      workoutElement += `
	  <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value speed-value">${workout.speed.toFixed(
          1
        )}</span>
        <span class="workout__unit">mile/h</span>
      </div>
	  <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value elevation-value">${
          workout.ElevationGain
        }</span>
        <span class="workout__unit">m</span>
      </div>
    `;

    workoutElement += `
		<div class="workout-manipulate">
			<button class="workout-btn edit-btn" title="Edit workout">
	  		<i class="fa-solid fa-pen-to-square"></i> Edit
			</button>
			<button class="workout-btn delete-btn" title="Delete workout">
      <i class="fa-regular fa-trash-can"></i> Delete
			</button>
		</div>
	</li>
	`;

    form.insertAdjacentHTML("afterend", workoutElement);

    const editWorkoutBtn = document
      .querySelector(".workout-manipulate")
      .querySelector(".edit-btn");
    const deleteWorkoutBtn = document
      .querySelector(".workout-manipulate")
      .querySelector(".delete-btn");

    editWorkoutBtn.addEventListener("click", this._editWorkout.bind(this));
    deleteWorkoutBtn.addEventListener("click", this._deleteWorkout.bind(this));
  }

  _goToClickedWorkoutOnMap(clickEvent) {
    const clickedSpot = clickEvent.target;
    const wrongClick = clickedSpot.closest(".workout-btn");
    const clickedWorkoutElement_2 = clickedSpot.closest(".workout");

    if (wrongClick || !clickedWorkoutElement_2) return;

    const clickedTargetWorkout = this.#workouts.find(
      (wrk) => wrk.id == clickedWorkoutElement_2.dataset.id
    );

    this.#map.setView(clickedTargetWorkout.coordinates, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    const newRecreatedWorkoutsArr = [];
    let recreatedWorkout;

    data.forEach((workoutLocale) => {
      if (workoutLocale.type === "running") {
        recreatedWorkout = new Running(
          workoutLocale.coordinates,
          workoutLocale.distance,
          workoutLocale.duration,
          workoutLocale.cadence
        );
      }

      if (workoutLocale.type === "cycling") {
        recreatedWorkout = new Cycling(
          workoutLocale.coordinates,
          workoutLocale.distance,
          workoutLocale.duration,
          workoutLocale.ElevationGain
        );
      }

      newRecreatedWorkoutsArr.push(recreatedWorkout);
    });

    this.#workouts = newRecreatedWorkoutsArr;

    this.#workouts.forEach((workout) => this._renderWorkoutOnList(workout));

    if (this.#workouts.length > 1)
      manipulateWorkouts.classList.remove("hidden");
  }

  _editWorkout(event) {
    const targetElement = event.target.closest(".workout");

    if (!targetElement) return;

    const targetWorkout = this.#workouts.find(
      (workout) => workout.id == targetElement.dataset.id
    );

    let newFormElement = `
    <form class="form form-edit" data-id="${targetElement.dataset.id}">
      <span class="edit-mode">Edit mode</span>
      <div class="form__row">
        <label class="form__label">Distance</label>
        <input
          class="form__input form__input--distance"
          placeholder="mile"
        />
      </div>
      <i class="fa-solid fa-xmark undo undo-edit"></i>
      <div class="form__row">
        <label class="form__label">Duration</label>
        <input
          class="form__input form__input--duration"
          placeholder="min"
        />
      </div>
    `;

    if (targetWorkout.type === "running") {
      newFormElement += `
      <div class="form__row">
        <label class="form__label">Cadence</label>
        <input
          class="form__input form__input--cadence"
          placeholder="step/min"
        />
      </div>
      `;
    }

    if (targetWorkout.type === "cycling") {
      newFormElement += `
      <div class="form__row">
        <label class="form__label">Elev Gain</label>
        <input
          class="form__input form__input--elevation"
          placeholder="meters"
        />
      </div>
      `;
    }

    newFormElement += `
    <button class="form__btn">OK</button>
    </form>
    `;

    if (!document.querySelector(".form-edit")) {
      targetElement.insertAdjacentHTML("beforebegin", newFormElement);

      newForm = document.querySelector(".form-edit");

      const newInputDistance = newForm.querySelector(".form__input--distance");
      const newInputDuration = newForm.querySelector(".form__input--duration");

      newInputDistance.value = targetWorkout.distance;
      newInputDuration.value = targetWorkout.duration;
      newInputDistance.focus();

      let newInputCadence, newInputElevation;

      if (targetWorkout.type === "running") {
        newInputCadence = newForm.querySelector(".form__input--cadence");
        newInputCadence.value = targetWorkout.cadence;
      }

      if (targetWorkout.type === "cycling") {
        newInputElevation = newForm.querySelector(".form__input--elevation");
        newInputElevation.value = targetWorkout.ElevationGain;
      }

      const updateWorkout = function (event) {
        event.preventDefault();

        const newWorkoutDistance = +newInputDistance.value;
        const newWorkoutDuration = +newInputDuration.value;

        if (targetWorkout.type === "running") {
          const newWorkoutCadence = +newInputCadence.value;
          if (
            !this.isAllInputsValid(
              newWorkoutDistance,
              newWorkoutDuration,
              newWorkoutCadence
            )
          )
            return this.showMessage(
              "All input have to be finite numbers!",
              "red"
            );

          if (
            this.isSomeInputsEmpty(
              newWorkoutDistance,
              newWorkoutDuration,
              newWorkoutCadence
            )
          )
            return this.showMessage("Please fill out all inputs!", "red");

          if (
            !this.isAllInputsPossitive(
              newWorkoutDistance,
              newWorkoutDuration,
              newWorkoutCadence
            )
          )
            return this.showMessage(
              "All inputs have to be possitive numbers!",
              "red"
            );

          targetWorkout.distance = newWorkoutDistance;
          targetWorkout.duration = newWorkoutDuration;
          targetWorkout.cadence = newWorkoutCadence;
          targetWorkout.paces = targetWorkout.duration / targetWorkout.distance;
          targetElement.querySelector(".distance-value").textContent =
            targetWorkout.distance;
          targetElement.querySelector(".duration-value").textContent =
            targetWorkout.duration;
          targetElement.querySelector(".paces-value").textContent =
            targetWorkout.paces.toFixed(1);
          targetElement.querySelector(".cadence-value").textContent =
            targetWorkout.cadence;
        }

        if (targetWorkout.type === "cycling") {
          const newWorkoutElevation = +newInputElevation.value;
          if (
            !this.isAllInputsValid(
              newWorkoutDistance,
              newWorkoutDuration,
              newWorkoutElevation
            )
          )
            return this.showMessage(
              "All input have to be finite numbers!",
              "red"
            );

          if (
            this.isSomeInputsEmpty(
              newWorkoutDistance,
              newWorkoutDuration,
              newWorkoutElevation
            )
          )
            return this.showMessage("Please fill out all inputs!", "red");

          if (
            !this.isAllInputsPossitive(newWorkoutDistance, newWorkoutDuration)
          )
            return this.showMessage(
              "Distance and Duration have to be possitive numbers!",
              "red"
            );

          targetWorkout.distance = newWorkoutDistance;
          targetWorkout.duration = newWorkoutDuration;
          targetWorkout.ElevationGain = newWorkoutElevation;
          targetWorkout.speed =
            targetWorkout.distance / (targetWorkout.duration / 60);
          targetElement.querySelector(".distance-value").textContent =
            targetWorkout.distance;
          targetElement.querySelector(".duration-value").textContent =
            targetWorkout.duration;
          targetElement.querySelector(".speed-value").textContent =
            targetWorkout.speed.toFixed(1);
          targetElement.querySelector(".elevation-value").textContent =
            targetWorkout.ElevationGain;
        }

        this.showMessage("Workout successfully updated!", "#00c46a");
        this._setLocalStorage();
        newForm.remove();
      };

      newForm.addEventListener("submit", updateWorkout.bind(this));

      document
        .querySelector(".undo-edit")
        .addEventListener("click", () => newForm.remove());
    }
  }

  _deleteWorkout(event) {
    const targetElement = event.target.closest(".workout");

    if (!targetElement) return;

    const targetWorkout = this.#workouts.findIndex(
      (workout) => workout.id == targetElement.dataset.id
    );

    targetElement.remove();
    this.#markers.at(targetWorkout).remove();
    this.#markers.splice(targetWorkout, 1);
    this.#workouts.splice(targetWorkout, 1);
    this.#workouts.length !== 0
      ? this._setLocalStorage()
      : localStorage.removeItem("workouts");
    if (this.#workouts.length === 1) manipulateWorkouts.classList.add("hidden");
    if (newForm && targetElement.dataset.id === newForm.dataset.id)
      newForm.remove();

    this.showMessage("Workout successfully deleted!", "#00c46a");
  }

  // gonna work on this later

  // _seeAllWorkouts() {}

  _deleteAllWorkouts() {
    const removeHidden = function () {
      overlay.classList.remove("hidden");
      checkWindow.classList.remove("hidden");
      mapSpot.style.zIndex = -1;
    };

    const addHidden = function () {
      overlay.classList.add("hidden");
      checkWindow.classList.add("hidden");
      mapSpot.style.zIndex = 1;
    };

    removeHidden();

    const deleteOperation = function () {
      const allWorkouts = document.querySelectorAll(".workout");
      allWorkouts.forEach((workout) => workout.remove());
      this.#markers.forEach((marker) => marker.remove());
      this.#markers.splice(0);
      this.#workouts.splice(0);
      localStorage.removeItem("workouts");
      manipulateWorkouts.classList.add("hidden");
      if (form) this._hideClearForm();
      if (newForm) newForm.remove();
      addHidden();
      this.showMessage("All workouts successfully deleted!", "#00c46a");
    };

    yesBtn.addEventListener("click", deleteOperation.bind(this));

    noBtn.addEventListener("click", addHidden);
  }
}

const app = new App();
