const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.querySelector('#score');
const targetLabelEl = document.querySelector('#targetLabel');
const timeLeftEl = document.querySelector('#timeLeft');
const statusEl = document.querySelector('#status');
const startButton = document.querySelector('#startButton');
const pauseButton = document.querySelector('#pauseButton');

const SUN_X = canvas.width / 2;
const SUN_Y = canvas.height / 2;

const PLANET_DATA = [
  { name: 'Mercury', color: '#b4b0ab', radiusKm: 2440, orbitAU: 0.39, periodDays: 88, moons: [] },
  { name: 'Venus', color: '#d9b684', radiusKm: 6052, orbitAU: 0.72, periodDays: 225, moons: [] },
  {
    name: 'Earth',
    color: '#5cb8ff',
    radiusKm: 6371,
    orbitAU: 1,
    periodDays: 365,
    moons: [{ name: 'Moon', color: '#d8dcdf', orbitKm: 384400, periodDays: 27.3, radiusKm: 1737 }],
  },
  {
    name: 'Mars',
    color: '#f08c63',
    radiusKm: 3389,
    orbitAU: 1.52,
    periodDays: 687,
    moons: [
      { name: 'Phobos', color: '#c6b59d', orbitKm: 9377, periodDays: 0.3, radiusKm: 11 },
      { name: 'Deimos', color: '#ab9d89', orbitKm: 23460, periodDays: 1.3, radiusKm: 6 },
    ],
  },
  {
    name: 'Jupiter',
    color: '#e0c59d',
    radiusKm: 69911,
    orbitAU: 5.2,
    periodDays: 4333,
    moons: [
      { name: 'Io', color: '#f5df8e', orbitKm: 421700, periodDays: 1.8, radiusKm: 1821 },
      { name: 'Europa', color: '#d6ddd7', orbitKm: 671100, periodDays: 3.6, radiusKm: 1560 },
      { name: 'Ganymede', color: '#8c8e85', orbitKm: 1070400, periodDays: 7.2, radiusKm: 2634 },
      { name: 'Callisto', color: '#7e7067', orbitKm: 1882700, periodDays: 16.7, radiusKm: 2410 },
    ],
  },
  {
    name: 'Saturn',
    color: '#e7d9a8',
    radiusKm: 58232,
    orbitAU: 9.58,
    periodDays: 10759,
    moons: [
      { name: 'Mimas', color: '#b3b0a8', orbitKm: 185540, periodDays: 0.9, radiusKm: 198 },
      { name: 'Enceladus', color: '#e9eef4', orbitKm: 237948, periodDays: 1.4, radiusKm: 252 },
      { name: 'Tethys', color: '#d9d8d2', orbitKm: 294619, periodDays: 1.9, radiusKm: 531 },
      { name: 'Dione', color: '#b6b5b0', orbitKm: 377396, periodDays: 2.7, radiusKm: 561 },
      { name: 'Rhea', color: '#a8a8a2', orbitKm: 527108, periodDays: 4.5, radiusKm: 763 },
      { name: 'Titan', color: '#e4b978', orbitKm: 1221870, periodDays: 15.9, radiusKm: 2575 },
      { name: 'Iapetus', color: '#937d6e', orbitKm: 3560820, periodDays: 79.3, radiusKm: 734 },
    ],
  },
  {
    name: 'Uranus',
    color: '#9de6f0',
    radiusKm: 25362,
    orbitAU: 19.2,
    periodDays: 30687,
    moons: [
      { name: 'Miranda', color: '#c3c8cb', orbitKm: 129390, periodDays: 1.4, radiusKm: 235 },
      { name: 'Ariel', color: '#d8dfde', orbitKm: 191020, periodDays: 2.5, radiusKm: 579 },
      { name: 'Umbriel', color: '#8e8d8b', orbitKm: 266300, periodDays: 4.1, radiusKm: 585 },
      { name: 'Titania', color: '#c4beb9', orbitKm: 435910, periodDays: 8.7, radiusKm: 789 },
      { name: 'Oberon', color: '#9f9a93', orbitKm: 583520, periodDays: 13.5, radiusKm: 761 },
    ],
  },
  {
    name: 'Neptune',
    color: '#6583ff',
    radiusKm: 24622,
    orbitAU: 30.05,
    periodDays: 60190,
    moons: [
      { name: 'Triton', color: '#d8dbe4', orbitKm: 354759, periodDays: 5.9, radiusKm: 1353 },
      { name: 'Nereid', color: '#9aa0aa', orbitKm: 5513818, periodDays: 360.1, radiusKm: 170 },
    ],
  },
];

const state = {
  running: false,
  paused: false,
  score: 0,
  timeLeft: 60,
  targetName: '',
  planetAngles: new Map(),
  moonAngles: new Map(),
  asteroidPhase: Math.random() * Math.PI,
  asteroids: [],
  clickableBodies: [],
  lastFrameTime: 0,
  secondAccumulator: 0,
};

function setStatus(message, mode = 'normal') {
  statusEl.textContent = message;
  statusEl.classList.remove('warning', 'lost');

  if (mode !== 'normal') {
    statusEl.classList.add(mode);
  }
}

function createAsteroidBelt() {
  return Array.from({ length: 240 }, (_, index) => {
    const orbitAu = 2.1 + Math.random() * 1.2;
    return {
      id: index,
      orbitAu,
      radius: 0.9 + Math.random() * 1.9,
      angle: Math.random() * Math.PI * 2,
      speed: 0.0012 + Math.random() * 0.001,
      tint: `hsl(${20 + Math.random() * 30} 35% ${45 + Math.random() * 20}%)`,
    };
  });
}

function orbitalRadiusToPixels(orbitAu) {
  const maxOrbit = 31;
  const minPx = 42;
  const maxPx = canvas.height * 0.46;
  const ratio = Math.log(1 + orbitAu) / Math.log(1 + maxOrbit);
  return minPx + ratio * (maxPx - minPx);
}

function planetSizePx(radiusKm) {
  const min = 4;
  const max = 14;
  const ratio = Math.log(radiusKm) / Math.log(69911);
  return min + ratio * (max - min);
}

function moonOrbitPx(orbitKm, planetRadiusPx) {
  return Math.max(planetRadiusPx + 8, Math.log10(orbitKm) * 8.6 - 27);
}

function moonSizePx(radiusKm) {
  return Math.max(1.5, Math.log10(radiusKm + 20));
}

function pickTarget() {
  const names = [];

  PLANET_DATA.forEach((planet) => {
    names.push(planet.name);
    planet.moons.forEach((moon) => names.push(moon.name));
  });

  state.targetName = names[Math.floor(Math.random() * names.length)];
  targetLabelEl.textContent = state.targetName;
}

function resetRound() {
  state.score = 0;
  state.timeLeft = 60;
  state.secondAccumulator = 0;
  state.asteroids = createAsteroidBelt();
  state.clickableBodies = [];

  PLANET_DATA.forEach((planet, index) => {
    state.planetAngles.set(planet.name, (index * Math.PI) / 3.8);
    planet.moons.forEach((moon, moonIndex) => {
      state.moonAngles.set(moon.name, (moonIndex * Math.PI) / 2.4 + index * 0.4);
    });
  });

  scoreEl.textContent = '0';
  timeLeftEl.textContent = String(state.timeLeft);
  pickTarget();
  setStatus('Find the highlighted target in the moving model.');
}

function drawStars() {
  for (let i = 0; i < 280; i += 1) {
    const x = (i * 137) % canvas.width;
    const y = (i * 97 + performance.now() * 0.004) % canvas.height;
    const size = (i % 5 === 0) ? 2 : 1;
    ctx.fillStyle = i % 7 === 0 ? '#b7cbff' : '#d9e2ff';
    ctx.fillRect(x, y, size, size);
  }
}

function drawSun() {
  const glow = 34 + Math.sin(performance.now() * 0.0028) * 4;
  const grad = ctx.createRadialGradient(SUN_X, SUN_Y, 10, SUN_X, SUN_Y, 52);
  grad.addColorStop(0, '#fff9c0');
  grad.addColorStop(0.5, '#ffbf58');
  grad.addColorStop(1, 'rgba(255, 180, 77, 0.05)');

  ctx.beginPath();
  ctx.arc(SUN_X, SUN_Y, glow, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = '#ffcc67';
  ctx.beginPath();
  ctx.arc(SUN_X, SUN_Y, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#09112f';
  ctx.font = '600 12px system-ui';
  ctx.fillText('Sun', SUN_X - 12, SUN_Y + 4);
}

function drawOrbitRing(radiusPx) {
  ctx.strokeStyle = '#8aa2ff22';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(SUN_X, SUN_Y, radiusPx, 0, Math.PI * 2);
  ctx.stroke();
}

function updateSimulation(deltaSeconds) {
  const speedBoost = 20;

  PLANET_DATA.forEach((planet) => {
    const angle = state.planetAngles.get(planet.name);
    const period = Math.max(planet.periodDays / speedBoost, 1);
    const delta = (deltaSeconds * Math.PI * 2) / period;
    state.planetAngles.set(planet.name, angle + delta);

    planet.moons.forEach((moon) => {
      const moonAngle = state.moonAngles.get(moon.name);
      const moonPeriod = Math.max(moon.periodDays / speedBoost, 0.08);
      const moonDelta = (deltaSeconds * Math.PI * 2) / moonPeriod;
      state.moonAngles.set(moon.name, moonAngle + moonDelta);
    });
  });

  state.asteroids.forEach((asteroid) => {
    asteroid.angle += asteroid.speed * deltaSeconds * 60;
  });
}

function drawAsteroids() {
  state.asteroids.forEach((asteroid) => {
    const radiusPx = orbitalRadiusToPixels(asteroid.orbitAu);
    const x = SUN_X + Math.cos(asteroid.angle + state.asteroidPhase) * radiusPx;
    const y = SUN_Y + Math.sin(asteroid.angle + state.asteroidPhase) * radiusPx * 0.67;

    ctx.fillStyle = asteroid.tint;
    ctx.fillRect(x, y, asteroid.radius, asteroid.radius);
  });

  ctx.fillStyle = '#9aa5c9';
  ctx.font = '12px system-ui';
  ctx.fillText('Asteroid Belt', SUN_X + orbitalRadiusToPixels(2.9) + 6, SUN_Y - 4);
}

function drawPlanetsAndMoons() {
  state.clickableBodies = [];

  PLANET_DATA.forEach((planet) => {
    const orbitPx = orbitalRadiusToPixels(planet.orbitAU);
    drawOrbitRing(orbitPx);

    const angle = state.planetAngles.get(planet.name);
    const px = SUN_X + Math.cos(angle) * orbitPx;
    const py = SUN_Y + Math.sin(angle) * orbitPx * 0.68;
    const pr = planetSizePx(planet.radiusKm);

    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = planet.color;
    ctx.fill();

    ctx.fillStyle = '#dfe6ff';
    ctx.font = '11px system-ui';
    ctx.fillText(planet.name, px + pr + 3, py + 3);

    state.clickableBodies.push({ name: planet.name, x: px, y: py, radius: pr + 4 });

    planet.moons.forEach((moon) => {
      const moonOrbit = moonOrbitPx(moon.orbitKm, pr);
      const moonAngle = state.moonAngles.get(moon.name);
      const mx = px + Math.cos(moonAngle) * moonOrbit;
      const my = py + Math.sin(moonAngle) * moonOrbit * 0.82;
      const mr = moonSizePx(moon.radiusKm);

      ctx.strokeStyle = '#a9b8ff1c';
      ctx.beginPath();
      ctx.arc(px, py, moonOrbit, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fillStyle = moon.color;
      ctx.fill();

      if (moon.name === state.targetName) {
        ctx.strokeStyle = '#ffe287';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, mr + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      state.clickableBodies.push({ name: moon.name, x: mx, y: my, radius: mr + 4 });
    });

    if (planet.name === state.targetName) {
      ctx.strokeStyle = '#ffe287';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, pr + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  });
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawSun();
  drawAsteroids();
  drawPlanetsAndMoons();
}

function endGame() {
  state.running = false;
  state.paused = false;
  startButton.textContent = 'Play again';
  pauseButton.textContent = 'Pause';
  pauseButton.disabled = true;
  setStatus(`Time up! Final score: ${state.score}.`, 'lost');
}

function updateTimer(deltaSeconds) {
  state.secondAccumulator += deltaSeconds;

  while (state.secondAccumulator >= 1) {
    state.secondAccumulator -= 1;
    state.timeLeft -= 1;
    if (state.timeLeft <= 10) {
      setStatus('Hurry! Last 10 seconds.', 'warning');
    }
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      timeLeftEl.textContent = '0';
      endGame();
      return;
    }
    timeLeftEl.textContent = String(state.timeLeft);
  }
}

function loop(timestamp) {
  const deltaSeconds = Math.min((timestamp - state.lastFrameTime) / 1000, 0.05);
  state.lastFrameTime = timestamp;

  if (state.running && !state.paused) {
    updateSimulation(deltaSeconds);
    updateTimer(deltaSeconds);
  }

  drawScene();
  requestAnimationFrame(loop);
}

function startGame() {
  resetRound();
  state.running = true;
  state.paused = false;
  startButton.textContent = 'Restart';
  pauseButton.disabled = false;
  pauseButton.textContent = 'Pause';
}

function togglePause() {
  if (!state.running) {
    return;
  }
  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
  if (state.paused) {
    setStatus('Paused. Resume when ready.');
  } else {
    setStatus('Back in motion. Find your target.');
  }
}

function handleCanvasClick(event) {
  if (!state.running || state.paused) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top) * scaleY;

  const found = state.clickableBodies.find((body) => {
    const dx = clickX - body.x;
    const dy = clickY - body.y;
    return dx * dx + dy * dy <= body.radius * body.radius;
  });

  if (!found) {
    state.score = Math.max(0, state.score - 1);
    scoreEl.textContent = String(state.score);
    setStatus('Missed. Aim closer to planets or moon dots.', 'warning');
    return;
  }

  if (found.name === state.targetName) {
    state.score += 5;
    scoreEl.textContent = String(state.score);
    setStatus(`Nice! You found ${found.name}. Next target loaded.`);
    pickTarget();
  } else {
    state.score = Math.max(0, state.score - 2);
    scoreEl.textContent = String(state.score);
    setStatus(`You clicked ${found.name}, not ${state.targetName}.`, 'warning');
  }
}

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
canvas.addEventListener('click', handleCanvasClick);

state.lastFrameTime = performance.now();
requestAnimationFrame(loop);
