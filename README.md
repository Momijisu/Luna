# Solar System Scout

A static browser game that visualizes a scale-style model of the Solar System with:

- all 8 planets orbiting the Sun,
- moons for each planet that has them,
- an animated asteroid belt orbiting the Sun,
- a click-to-find gameplay loop with score + timer.

## Play locally

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>.

## How to play

1. Press **Start game**.
2. The HUD shows a **Target** (planet or moon).
3. Click that target in the live moving model.
4. Correct click = +5 points, wrong click = -2, empty space = -1.
5. You have 60 seconds.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. For **Build and deployment**, choose **Deploy from a branch**.
4. Select your default branch and `/ (root)`.
5. Save and wait for the published URL.
