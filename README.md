# Orbital Commander

A static browser game where you command a spaceship through a moving Solar System model.

## Features

- Full Sun-centered simulation of all 8 planets.
- Moons for planets that have them.
- Animated asteroid belt around the Sun.
- Commander gameplay:
  - you start at **Earth**,
  - click a planet or moon to preview a transfer path,
  - a route line is drawn using a simple gravity-influenced path solver,
  - press **Engage route** to fly the ship along that path,
  - adjust simulation speed with **-10 / +10** controls (default 100% = 1x realtime),
  - arrive and continue from your new current orbital body.

## Play locally

```bash
python3 -m http.server 8000 --directory /workspace/Luna
```

Open <http://127.0.0.1:8000/index.html>.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. Set **Build and deployment** to **Deploy from a branch**.
4. Choose your default branch and `/ (root)`.
5. Save and wait for the published URL.
