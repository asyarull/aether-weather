# AETHER — Nature Weather Experience

A minimal, editorial weather website built with plain HTML, CSS, and vanilla JavaScript. Real-time weather and 5-day forecasts for cities in **Indonesia, Singapore, and Japan**, powered by the [Open-Meteo](https://open-meteo.com/) API.

## Features

- Fixed black sidebar navigation (collapses to a compact menu on mobile)
- Editorial hero with a single large nature landscape image
- Real city search with live suggestions (geocoding via Open-Meteo)
- Results limited to Indonesia (ID), Singapore (SG), and Japan (JP)
- Current conditions: temperature, condition, feels-like, humidity, wind, precipitation, and local time (`timezone=auto`)
- 5-day forecast with day/date, condition, and max/min temperatures
- Quick-select locations: Malang, Jakarta, Bandung, Bali, Singapore, Tokyo, Osaka, Kyoto
- Loading, empty-result, and error states

## Project structure

```
aether-weather/
├── index.html        # Semantic page structure
├── styles.css        # Dark editorial theme, responsive layout
├── script.js         # Open-Meteo API logic and UI behavior
├── public/
│   └── images/
│       └── hero-nature.png   # Hero image (add your own here)
└── README.md
```

## Getting started

No build step or dependencies. Open `index.html` directly in a browser, or serve the folder:

```bash
npx serve .        # or: python -m http.server 8000
```

> Note: serve over HTTP rather than `file://` for the most reliable `fetch()` behavior.

## API

- **Geocoding:** `https://geocoding-api.open-meteo.com/v1/search` — resolves a city name to latitude/longitude, filtered to ID/SG/JP.
- **Forecast:** `https://api.open-meteo.com/v1/forecast` — current conditions + daily forecast, with `timezone=auto` and `forecast_days=5`.

Weather data by [Open-Meteo](https://open-meteo.com/).
