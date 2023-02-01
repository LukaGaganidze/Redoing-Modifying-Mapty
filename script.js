'use strict';

///////////////////////////////////////////////

// #fff WORKOUT CALSSES
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  _creteDate() {
    const month = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.dateGenerator = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} on ${month[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

// CLASS RUNNING
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration);
    this.cadance = cadance;
    this._clacPace();
    this._creteDate();
  }
  _clacPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// CLASS CYCLING
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._calcSpeed();
    this._creteDate();
  }
  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

// ELEMENTS
const sideBar = document.querySelector('.sidebar');
const allActivityContainer = document.querySelector('.activity-container');
const formResultContainer = document.querySelector('.activity-container');
const form = document.querySelector('.activity');
//INPUTS
const inputSwitch = document.querySelector('.select');
const inputDuration = document.getElementById('duration');
const inputDistance = document.getElementById('distance');
const inputCadance = document.getElementById('cadance');
const inputElevation = document.getElementById('elevation');
// LOGO AND LOGO CONTAINER
const logoBox = document.querySelector('.logo-div');
const logo = document.querySelector('.main-logo');

// #fff CLASS APP
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #setZoom = 15;
  constructor() {
    // get current position
    this._getPosition();

    // get local storage
    this._getWorkoutDataToLocalStorage();

    // submit form event
    form.addEventListener('submit', this._newWorkout.bind(this));

    // form toggle event
    inputSwitch.addEventListener('change', this._toggleElevationField);

    // move map based on result list
    formResultContainer.addEventListener(
      'click',
      this._resultMoveMap.bind(this)
    );

    // clear all results
    this.clearAllResults();
  }
  clearAllResults() {
    logo.addEventListener('click', function () {
      localStorage.clear();
      location.reload();
    });
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          'location unavalable';
        }
      );
  }

  _loadMap(loc) {
    const { latitude } = loc.coords;
    const { longitude } = loc.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#setZoom);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    // laod ping from local memory API
    this.#workouts.forEach(el => {
      this._renderWorkoutOnPopup(el);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDuration.focus();
  }

  _toggleElevationField() {
    document
      .getElementById('elevation')
      .closest('div')
      .classList.toggle('hidden');
    document
      .getElementById('cadance')
      .closest('div')
      .classList.toggle('hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    // helper functions
    const positiveNumbers = (...nums) => nums.every(n => n > 0);
    const numsCheck = (...nums) => nums.every(n => Number.isFinite(n));

    // get data from form
    const type = inputSwitch.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    //
    const { lat } = this.#mapEvent.latlng;
    const { lng } = this.#mapEvent.latlng;
    // check if data is valid

    let workout;
    // if workout is running create running object
    if (type === 'running') {
      const cadance = +inputCadance.value;
      if (
        !positiveNumbers(duration, distance, cadance) ||
        !numsCheck(duration, distance, cadance)
      ) {
        return alert('please enter positive number');
      }
      workout = new Running([lat, lng], distance, duration, cadance);
    }

    // if workout is cycling create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !positiveNumbers(duration, distance) ||
        !numsCheck(duration, distance, elevation)
      ) {
        return alert('please enter positive number');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add new object to workout array
    this.#workouts.push(workout);

    // render workout on a list
    this._renderNewWorkout(workout);

    // render workout on a map as a market
    this._renderWorkoutOnPopup(workout);

    //hide form
    form.classList.add('hidden');

    // cler fields
    inputCadance.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    this._setWorkoutDataToLocalStorage();
  }

  _renderNewWorkout(workout) {
    let html = `
    <div class="result results-${workout.type}" data-id="${workout.id}">
    <p class="res-header">${workout.dateGenerator}</p>
    <p class="indicator-km">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
      workout.distance
    } KM</p>
    <p class="indicator-min">⏱ ${workout.duration} MIN</p>
    `;

    if (workout.type === 'running') {
      html += `
      <p class="indicator-min-km">⚡️ ${workout.pace.toFixed(1)} 
      MIN/KM</p>
      <p class="indicator-min-spm">🦶🏼 ${workout.cadance} SPM</p>
      </div>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
      <p class="indicator-min-km">⚡️ ${workout.speed.toFixed(1)} KM/H</p>
      <p class="indicator-min-spm">⛰ ${workout.elevationGain} M</p>
      </div>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _renderWorkoutOnPopup(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          content: `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
            workout.dateGenerator
          }`,
          minWidth: 100,
          maxWidth: 200,
          className: 'popup',
        })
      )
      .openPopup();
  }

  _resultMoveMap(e) {
    // current target
    const result = e.target.closest('.result');
    if (!result) return;

    // finding correct object
    const chosenWorkout = this.#workouts.find(
      work => work.id === result.dataset.id
    );

    // move map to that object
    this.#map.setView(chosenWorkout.coords, this.#setZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setWorkoutDataToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getWorkoutDataToLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(el => {
      this._renderNewWorkout(el);
      // this._renderWorkoutOnPopup(el);
    });
  }
}

const app = new App();
