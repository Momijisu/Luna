const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');

const currentBodyEl = document.querySelector('#currentBody');
const selectedBodyEl = document.querySelector('#selectedBody');
const etaEl = document.querySelector('#eta');
const statusEl = document.querySelector('#status');
const engageButton = document.querySelector('#engageButton');
const cancelButton = document.querySelector('#cancelButton');
const speedDownButton = document.querySelector('#speedDownButton');
const speedUpButton = document.querySelector('#speedUpButton');
const speedLabel = document.querySelector('#speedLabel');

const SUN_X = canvas.width / 2;
const SUN_Y = canvas.height / 2;

const PLANETS = [
  { name: 'Mercury', color: '#b4b0ab', radiusKm: 2440, orbitAU: 0.39, periodDays: 88, moons: [] },
  { name: 'Venus', color: '#d9b684', radiusKm: 6052, orbitAU: 0.72, periodDays: 225, moons: [] },
  { name: 'Earth', color: '#5cb8ff', radiusKm: 6371, orbitAU: 1, periodDays: 365, moons: [{ name: 'Moon', color: '#d8dcdf', orbitKm: 384400, periodDays: 27.3, radiusKm: 1737 }] },
  { name: 'Mars', color: '#f08c63', radiusKm: 3389, orbitAU: 1.52, periodDays: 687, moons: [{ name: 'Phobos', color: '#c6b59d', orbitKm: 9377, periodDays: 0.3, radiusKm: 11 }, { name: 'Deimos', color: '#ab9d89', orbitKm: 23460, periodDays: 1.3, radiusKm: 6 }] },
  { name: 'Jupiter', color: '#e0c59d', radiusKm: 69911, orbitAU: 5.2, periodDays: 4333, moons: [{ name: 'Io', color: '#f5df8e', orbitKm: 421700, periodDays: 1.8, radiusKm: 1821 }, { name: 'Europa', color: '#d6ddd7', orbitKm: 671100, periodDays: 3.6, radiusKm: 1560 }, { name: 'Ganymede', color: '#8c8e85', orbitKm: 1070400, periodDays: 7.2, radiusKm: 2634 }, { name: 'Callisto', color: '#7e7067', orbitKm: 1882700, periodDays: 16.7, radiusKm: 2410 }] },
  { name: 'Saturn', color: '#e7d9a8', radiusKm: 58232, orbitAU: 9.58, periodDays: 10759, moons: [{ name: 'Titan', color: '#e4b978', orbitKm: 1221870, periodDays: 15.9, radiusKm: 2575 }, { name: 'Rhea', color: '#a8a8a2', orbitKm: 527108, periodDays: 4.5, radiusKm: 763 }] },
  { name: 'Uranus', color: '#9de6f0', radiusKm: 25362, orbitAU: 19.2, periodDays: 30687, moons: [{ name: 'Titania', color: '#c4beb9', orbitKm: 435910, periodDays: 8.7, radiusKm: 789 }, { name: 'Oberon', color: '#9f9a93', orbitKm: 583520, periodDays: 13.5, radiusKm: 761 }] },
  { name: 'Neptune', color: '#6583ff', radiusKm: 24622, orbitAU: 30.05, periodDays: 60190, moons: [{ name: 'Triton', color: '#d8dbe4', orbitKm: 354759, periodDays: 5.9, radiusKm: 1353 }] },
];

const state = {
  simTimeDays: 0,
  bodyMap: new Map(),
  asteroids: [],
  currentBodyName: 'Earth',
  selectedBodyName: null,
  route: null,
  ship: { x: 0, y: 0, routeIndex: 0, engaged: false, speed: 180 },
  simulationSpeedPercent: 100,
};

function setStatus(text, mode = 'normal') {
  statusEl.textContent = text;
  statusEl.classList.remove('warning', 'lost', 'ok');
  if (mode !== 'normal') {
    statusEl.classList.add(mode);
  }
}

function orbitPx(au) {
  const maxOrbit = 31;
  const minPx = 42;
  const maxPx = canvas.height * 0.46;
  const ratio = Math.log(1 + au) / Math.log(1 + maxOrbit);
  return minPx + ratio * (maxPx - minPx);
}

function planetRadiusPx(radiusKm) {
  return 4 + (Math.log(radiusKm) / Math.log(69911)) * 10;
}

function moonOrbitPx(km, parentRadius) {
  return Math.max(parentRadius + 8, Math.log10(km) * 8.6 - 27);
}

function moonRadiusPx(radiusKm) {
  return Math.max(1.6, Math.log10(radiusKm + 20));
}

function initAsteroids() {
  state.asteroids = Array.from({ length: 220 }, () => ({
    orbit: 2.1 + Math.random() * 1.2,
    angle: Math.random() * Math.PI * 2,
    speed: 0.0006 + Math.random() * 0.0008,
    size: 0.8 + Math.random() * 1.8,
  }));
}

function simulateBodies(simTimeDays = state.simTimeDays) {
  const bodyMap = new Map();

  bodyMap.set('Sun', { name: 'Sun', x: SUN_X, y: SUN_Y, radius: 18, mass: 28000, color: '#ffcc67' });

  PLANETS.forEach((planet, index) => {
    const angle = (simTimeDays * (Math.PI * 2)) / planet.periodDays + index * 0.55;
    const r = orbitPx(planet.orbitAU);
    const px = SUN_X + Math.cos(angle) * r;
    const py = SUN_Y + Math.sin(angle) * r * 0.68;
    const pr = planetRadiusPx(planet.radiusKm);

    bodyMap.set(planet.name, { name: planet.name, x: px, y: py, radius: pr, mass: Math.max(100, planet.radiusKm / 95), color: planet.color });

    planet.moons.forEach((moon, moonIndex) => {
      const ma = (simTimeDays * (Math.PI * 2)) / moon.periodDays + moonIndex * 1.9;
      const mr = moonOrbitPx(moon.orbitKm, pr);
      const mx = px + Math.cos(ma) * mr;
      const my = py + Math.sin(ma) * mr * 0.82;
      const msize = moonRadiusPx(moon.radiusKm);
      bodyMap.set(moon.name, { name: moon.name, x: mx, y: my, radius: msize, mass: Math.max(8, moon.radiusKm / 60), color: moon.color });
    });
  });

  return bodyMap;
}

function computeRoute(fromBody, toBody) {
  if (!fromBody || !toBody || fromBody.name === toBody.name) {
    return null;
  }

  const points = [{ x: fromBody.x, y: fromBody.y }];
  const simBodies = Array.from(state.bodyMap.values());

  let x = fromBody.x;
  let y = fromBody.y;
  let vx = (toBody.x - fromBody.x) * 0.0045;
  let vy = (toBody.y - fromBody.y) * 0.0045;

  const dt = 1;
  const maxSteps = 520;
  const goalRadius = toBody.radius + 10;

  for (let i = 0; i < maxSteps; i += 1) {
    const dxGoal = toBody.x - x;
    const dyGoal = toBody.y - y;
    const distGoal = Math.hypot(dxGoal, dyGoal) || 1;

    const thrust = 0.045;
    vx += (dxGoal / distGoal) * thrust;
    vy += (dyGoal / distGoal) * thrust;

    simBodies.forEach((body) => {
      if (body.name === fromBody.name || body.name === toBody.name || body.name === 'Sun' || PLANETS.some((p) => p.name === body.name)) {
        const dx = body.x - x;
        const dy = body.y - y;
        const distSq = Math.max(dx * dx + dy * dy, 90);
        const g = (body.mass * 0.18) / distSq;
        vx += dx * g;
        vy += dy * g;
      }
    });

    const drag = 0.992;
    vx *= drag;
    vy *= drag;

    x += vx * dt;
    y += vy * dt;
    points.push({ x, y });

    if (Math.hypot(toBody.x - x, toBody.y - y) <= goalRadius) {
      break;
    }
  }

  if (points.length < 2) {
    return null;
  }

  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  return { from: fromBody.name, to: toBody.name, points, length };
}

function findBodyAtPoint(x, y) {
  const bodies = Array.from(state.bodyMap.values()).filter((body) => body.name !== 'Sun');
  return bodies.find((body) => {
    const dx = x - body.x;
    const dy = y - body.y;
    return dx * dx + dy * dy <= (body.radius + 6) * (body.radius + 6);
  });
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 320; i += 1) {
    const x = (i * 137) % canvas.width;
    const y = (i * 97 + state.time * 0.2) % canvas.height;
    ctx.fillStyle = i % 7 === 0 ? '#b7cbff' : '#d9e2ff';
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
}

function drawAsteroids() {
  state.asteroids.forEach((a) => {
    a.angle += a.speed;
    const r = orbitPx(a.orbit);
    const x = SUN_X + Math.cos(a.angle) * r;
    const y = SUN_Y + Math.sin(a.angle) * r * 0.67;
    ctx.fillStyle = '#897b6f';
    ctx.fillRect(x, y, a.size, a.size);
  });
}

function drawBodies() {
  const sun = state.bodyMap.get('Sun');
  const glow = ctx.createRadialGradient(sun.x, sun.y, 8, sun.x, sun.y, 52);
  glow.addColorStop(0, '#fff9c0');
  glow.addColorStop(0.5, '#ffbf58');
  glow.addColorStop(1, 'rgba(255, 180, 77, 0.05)');
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, 34, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
  ctx.fillStyle = sun.color;
  ctx.fill();

  PLANETS.forEach((planet) => {
    const p = state.bodyMap.get(planet.name);
    const ring = orbitPx(planet.orbitAU);
    ctx.strokeStyle = '#8aa2ff22';
    ctx.beginPath();
    ctx.arc(SUN_X, SUN_Y, ring, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    ctx.fillStyle = '#dfe6ff';
    ctx.font = '11px system-ui';
    ctx.fillText(p.name, p.x + p.radius + 3, p.y + 3);

    planet.moons.forEach((moon) => {
      const m = state.bodyMap.get(moon.name);
      const or = moonOrbitPx(moon.orbitKm, p.radius);
      ctx.strokeStyle = '#a9b8ff1c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, or, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.fill();
    });
  });
}

function drawRoute() {
  if (!state.route) {
    return;
  }
  ctx.strokeStyle = '#81ecff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  state.route.points.forEach((pt, i) => {
    if (i === 0) {
      ctx.moveTo(pt.x, pt.y);
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  });
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawShip() {
  const x = state.ship.x;
  const y = state.ship.y;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#9ef6ff';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function updateShip(delta) {
  if (!state.ship.engaged || !state.route) {
    return;
  }

  const points = state.route.points;
  let idx = state.ship.routeIndex;

  while (idx < points.length - 1) {
    const target = points[idx + 1];
    const dx = target.x - state.ship.x;
    const dy = target.y - state.ship.y;
    const dist = Math.hypot(dx, dy);
    const step = state.ship.speed * delta;

    if (dist <= step) {
      state.ship.x = target.x;
      state.ship.y = target.y;
      idx += 1;
      state.ship.routeIndex = idx;
    } else {
      state.ship.x += (dx / dist) * step;
      state.ship.y += (dy / dist) * step;
      break;
    }
  }

  if (state.ship.routeIndex >= points.length - 1) {
    const destination = state.route.to;
    state.currentBodyName = destination;
    currentBodyEl.textContent = destination;
    setStatus(`Arrived at ${destination}. Plot your next transfer.`, 'ok');
    state.ship.engaged = false;
    state.ship.routeIndex = 0;
    state.route = null;
    state.selectedBodyName = null;
    selectedBodyEl.textContent = 'None';
    etaEl.textContent = '--';
    engageButton.disabled = true;
    cancelButton.disabled = true;
  }
}


function updateSpeedLabel() {
  speedLabel.textContent = `${state.simulationSpeedPercent}%`;
}

function updateSpeedButtons() {
  speedDownButton.disabled = state.simulationSpeedPercent <= 100;
  speedUpButton.disabled = state.simulationSpeedPercent >= 5000;
}

function adjustSimulationSpeed(deltaPercent) {
  const next = Math.max(100, Math.min(5000, state.simulationSpeedPercent + deltaPercent));
  state.simulationSpeedPercent = next;
  updateSpeedLabel();
  updateSpeedButtons();
  if (next === 100) {
    setStatus('Simulation speed set to realtime baseline (1x).');
  } else {
    setStatus(`Simulation speed set to ${(next / 100).toFixed(2)}x realtime.`, 'ok');
  }
}

function render(delta) {
  const speedFactor = state.simulationSpeedPercent / 100;
  state.simTimeDays += (delta * speedFactor) / 86400;
  state.bodyMap = simulateBodies(state.simTimeDays);

  if (!state.ship.engaged) {
    const currentBody = state.bodyMap.get(state.currentBodyName);
    if (currentBody) {
      state.ship.x = currentBody.x;
      state.ship.y = currentBody.y;
    }
  }

  drawBackground();
  drawAsteroids();
  drawBodies();
  drawRoute();
  drawShip();

  updateShip(delta);
}

function selectDestination(bodyName) {
  if (bodyName === state.currentBodyName) {
    setStatus('You are already at that body.', 'warning');
    return;
  }

  const fromBody = state.bodyMap.get(state.currentBodyName);
  const toBody = state.bodyMap.get(bodyName);
  const route = computeRoute(fromBody, toBody);

  if (!route) {
    setStatus('Unable to calculate route right now.', 'lost');
    return;
  }

  state.selectedBodyName = bodyName;
  state.route = route;
  selectedBodyEl.textContent = bodyName;
  const etaSeconds = Math.max(1, Math.round(route.length / state.ship.speed));
  etaEl.textContent = `${etaSeconds}s`;
  engageButton.disabled = false;
  cancelButton.disabled = false;
  setStatus(`Route preview ready: ${route.from} → ${route.to}. Engage when ready.`, 'ok');
}

function engageRoute() {
  if (!state.route || state.ship.engaged) {
    return;
  }
  state.ship.engaged = true;
  state.ship.routeIndex = 0;
  engageButton.disabled = true;
  cancelButton.disabled = true;
  setStatus(`Engaged. Ship is following transfer to ${state.route.to}.`);
}

function cancelRoute() {
  if (state.ship.engaged) {
    setStatus('Cannot cancel while engaged. Wait for arrival.', 'warning');
    return;
  }
  state.route = null;
  state.selectedBodyName = null;
  selectedBodyEl.textContent = 'None';
  etaEl.textContent = '--';
  engageButton.disabled = true;
  cancelButton.disabled = true;
  setStatus('Route cleared. Select another destination.');
}

canvas.addEventListener('click', (event) => {
  if (state.ship.engaged) {
    setStatus('Ship is in transit. Wait for arrival before plotting another route.', 'warning');
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

  const hit = findBodyAtPoint(x, y);
  if (!hit) {
    setStatus('No orbital body selected. Click a planet or moon.', 'warning');
    return;
  }

  selectDestination(hit.name);
});

engageButton.addEventListener('click', engageRoute);
cancelButton.addEventListener('click', cancelRoute);
speedDownButton.addEventListener('click', () => adjustSimulationSpeed(-10));
speedUpButton.addEventListener('click', () => adjustSimulationSpeed(10));

initAsteroids();
state.bodyMap = simulateBodies(0);
const earth = state.bodyMap.get('Earth');
state.ship.x = earth.x;
state.ship.y = earth.y;
updateSpeedLabel();
updateSpeedButtons();

let last = performance.now();
function loop(now) {
  const delta = Math.min((now - last) / 1000, 0.05);
  last = now;
  render(delta);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
