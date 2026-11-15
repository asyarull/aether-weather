/* ============================================================
   AETHER — Weather logic (Open-Meteo)
   ============================================================ */

"use strict";

/* ---------- Config ---------- */

const ALLOWED_COUNTRIES = { ID: "Indonesia", SG: "Singapore", JP: "Japan" };

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/* ---------- Elements ---------- */

const el = {
  menuToggle: document.getElementById("menuToggle"),
  sidebar: document.getElementById("sidebar"),
  overlay: document.getElementById("sidebarOverlay"),
  searchForm: document.getElementById("searchForm"),
  searchInput: document.getElementById("searchInput"),
  suggestions: document.getElementById("suggestions"),
  stateIdle: document.getElementById("stateIdle"),
  stateLoading: document.getElementById("stateLoading"),
  stateEmpty: document.getElementById("stateEmpty"),
  stateError: document.getElementById("stateError"),
  errorMessage: document.getElementById("errorMessage"),
  weatherResult: document.getElementById("weatherResult"),
  currentPlace: document.getElementById("currentPlace"),
  currentTemp: document.getElementById("currentTemp"),
  currentIcon: document.getElementById("currentIcon"),
  currentCondition: document.getElementById("currentCondition"),
  metaTime: document.getElementById("metaTime"),
  metaFeels: document.getElementById("metaFeels"),
  metaHumidity: document.getElementById("metaHumidity"),
  metaWind: document.getElementById("metaWind"),
  metaPrecip: document.getElementById("metaPrecip"),
  forecastList: document.getElementById("forecastList"),
};

/* ---------- Weather codes (Open-Meteo WMO) ---------- */

const WEATHER_CODES = {
  0:  { text: "Clear sky", icon: "☀️" },
  1:  { text: "Mainly clear", icon: "🌤️" },
  2:  { text: "Partly cloudy", icon: "⛅" },
  3:  { text: "Overcast", icon: "☁️" },
  45: { text: "Fog", icon: "🌫️" },
  48: { text: "Depositing rime fog", icon: "🌫️" },
  51: { text: "Light drizzle", icon: "🌦️" },
  53: { text: "Drizzle", icon: "🌦️" },
  55: { text: "Dense drizzle", icon: "🌧️" },
  56: { text: "Freezing drizzle", icon: "🌧️" },
  57: { text: "Freezing drizzle", icon: "🌧️" },
  61: { text: "Slight rain", icon: "🌦️" },
  63: { text: "Rain", icon: "🌧️" },
  65: { text: "Heavy rain", icon: "🌧️" },
  66: { text: "Freezing rain", icon: "🌧️" },
  67: { text: "Freezing rain", icon: "🌧️" },
  71: { text: "Slight snow", icon: "🌨️" },
  73: { text: "Snow", icon: "❄️" },
  75: { text: "Heavy snow", icon: "❄️" },
  77: { text: "Snow grains", icon: "🌨️" },
  80: { text: "Rain showers", icon: "🌦️" },
  81: { text: "Rain showers", icon: "🌧️" },
  82: { text: "Violent showers", icon: "⛈️" },
  85: { text: "Snow showers", icon: "🌨️" },
  86: { text: "Snow showers", icon: "🌨️" },
  95: { text: "Thunderstorm", icon: "⛈️" },
  96: { text: "Thunderstorm, hail", icon: "⛈️" },
  99: { text: "Thunderstorm, hail", icon: "⛈️" },
};

function weatherInfo(code) {
  return WEATHER_CODES[code] || { text: "Unknown", icon: "—" };
}

/* ---------- State helpers ---------- */

function showState(name) {
  [el.stateIdle, el.stateLoading, el.stateEmpty, el.stateError].forEach(
    (s) => (s.hidden = true)
  );
  el.weatherResult.hidden = true;
  if (name) name.hidden = false;
}

function showError(message) {
  el.errorMessage.textContent = message;
  showState(el.stateError);
}

/* ---------- API calls ---------- */

/**
 * Geocode a city name, limited to ID / SG / JP.
 * Returns an array of matching places.
 */
async function geocodeCity(name) {
  const params = new URLSearchParams({
    name,
    count: 10,
    language: "en",
    format: "json",
  });

  const response = await fetch(`${GEOCODING_URL}?${params}`);
  if (!response.ok) throw new Error("Geocoding service unavailable.");

  const data = await response.json();
  const results = data.results || [];

  // Keep only cities in the allowed countries.
  return results.filter((r) => ALLOWED_COUNTRIES[r.country_code]);
}

/**
 * Fetch current + 5-day forecast for a coordinate.
 * timezone=auto makes all returned times local to the city.
 */
async function fetchForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
    timezone: "auto",
    forecast_days: "5",
  });

  const response = await fetch(`${FORECAST_URL}?${params}`);
  if (!response.ok) throw new Error("Weather service unavailable.");
  return response.json();
}

/* ---------- Rendering ---------- */

function renderCurrent(place, data) {
  const c = data.current;
  const info = weatherInfo(c.weather_code);

  el.currentPlace.textContent =
    `${place.name}${place.admin1 ? ", " + place.admin1 : ""} — ${place.country}`;

  el.currentTemp.textContent = `${Math.round(c.temperature_2m)}°C`;
  el.currentIcon.textContent = info.icon;
  el.currentCondition.textContent = info.text;

  el.metaTime.textContent = formatLocalTime(c.time, data.timezone);
  el.metaFeels.textContent = `${Math.round(c.apparent_temperature)}°C`;
  el.metaHumidity.textContent = `${c.relative_humidity_2m}%`;
  el.metaWind.textContent = `${c.wind_speed_10m} km/h`;
  el.metaPrecip.textContent = `${c.precipitation} mm`;

  el.weatherResult.hidden = false;
  [el.stateIdle, el.stateLoading, el.stateEmpty, el.stateError].forEach(
    (s) => (s.hidden = true)
  );
}

function renderForecast(data) {
  const d = data.daily;
  el.forecastList.innerHTML = "";

  for (let i = 0; i < d.time.length; i++) {
    const info = weatherInfo(d.weather_code[i]);
    const date = new Date(d.time[i] + "T12:00:00");

    const li = document.createElement("li");
    li.className = "forecast-day";

    const day = document.createElement("p");
    day.className = "f-day";
    day.textContent =
      i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });

    const dateEl = document.createElement("p");
    dateEl.className = "f-date";
    dateEl.textContent = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

    const icon = document.createElement("p");
    icon.className = "f-icon";
    icon.textContent = info.icon;

    const cond = document.createElement("p");
    cond.className = "f-cond";
    cond.textContent = info.text;

    const temps = document.createElement("p");
    temps.className = "f-temps";
    temps.innerHTML =
      `<span class="f-max">${Math.round(d.temperature_2m_max[i])}°</span>` +
      `<span class="f-min">${Math.round(d.temperature_2m_min[i])}°</span>`;

    li.append(day, dateEl, icon, cond, temps);
    el.forecastList.appendChild(li);
  }
}

/** Local time from an ISO string like "2026-05-01T14:30". */
function formatLocalTime(iso, timezone) {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(date);
  } catch {
    return iso.slice(11, 16);
  }
}

/* ---------- Load weather for a place ---------- */

async function loadWeather(place) {
  showState(el.stateLoading);
  try {
    const data = await fetchForecast(place.latitude, place.longitude);
    renderCurrent(place, data);
    renderForecast(data);
    el.weatherResult.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    showError(
      "Could not load weather data right now. Please check your connection and try again."
    );
  }
}

/* ---------- Search ---------- */

let searchTimer = null;

el.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = el.searchInput.value.trim();
  if (!query) {
    showError("Please type a city name before searching.");
    return;
  }
  hideSuggestions();
  runSearch(query);
});

// Live suggestions while typing (debounced).
el.searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const query = el.searchInput.value.trim();
  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  searchTimer = setTimeout(() => showSuggestions(query), 350);
});

// Close suggestions when clicking elsewhere.
document.addEventListener("click", (e) => {
  if (!el.suggestions.contains(e.target) && e.target !== el.searchInput) {
    hideSuggestions();
  }
});

async function runSearch(query) {
  showState(el.stateLoading);
  try {
    const results = await geocodeCity(query);

    if (results.length === 0) {
      showState(el.stateEmpty);
      return;
    }

    // Pick the most relevant match and load its weather.
    loadWeather(results[0]);
  } catch (err) {
    showError(
      "Search is unavailable right now. Please try again in a moment."
    );
  }
}

async function showSuggestions(query) {
  try {
    const results = await geocodeCity(query);
    el.suggestions.innerHTML = "";
    el.suggestions.hidden = false;

    if (results.length === 0) {
      const li = document.createElement("li");
      li.className = "s-none";
      li.textContent = "No matches in Indonesia, Singapore, or Japan.";
      el.suggestions.appendChild(li);
      return;
    }

    results.forEach((place) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");

      const city = document.createElement("span");
      city.className = "s-city";
      city.textContent = place.name;

      const region = document.createElement("span");
      region.className = "s-region";
      region.textContent = [place.admin1, place.country]
        .filter(Boolean)
        .join(", ");

      li.append(city, region);
      li.addEventListener("click", () => {
        hideSuggestions();
        el.searchInput.value = place.name;
        loadWeather(place);
      });
      el.suggestions.appendChild(li);
    });
  } catch {
    hideSuggestions();
  }
}

function hideSuggestions() {
  el.suggestions.hidden = true;
  el.suggestions.innerHTML = "";
}

/* ---------- Quick locations ---------- */

const QUICK_CITIES = [
  { name: "Malang", country: "Indonesia" },
  { name: "Jakarta", country: "Indonesia" },
  { name: "Bandung", country: "Indonesia" },
  { name: "Bali", country: "Indonesia" },
  { name: "Singapore", country: "Singapore" },
  { name: "Tokyo", country: "Japan" },
  { name: "Osaka", country: "Japan" },
  { name: "Kyoto", country: "Japan" },
];

document.querySelectorAll(".group-btns button").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document
      .querySelectorAll(".group-btns button")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const cityName = btn.dataset.city;
    const expected = QUICK_CITIES.find((c) => c.name === cityName)?.country;

    showState(el.stateLoading);
    try {
      const results = await geocodeCity(cityName);

      // Prefer a result from the country the button belongs to.
      const place =
        results.find(
          (r) => expected && r.country === expected
        ) || results[0];

      if (!place) {
        showState(el.stateEmpty);
        return;
      }

      el.searchInput.value = place.name;
      loadWeather(place);
    } catch {
      showError(
        "Could not load weather data right now. Please try again shortly."
      );
    }
  });
});

/* ---------- Mobile sidebar ---------- */

function toggleMenu(force) {
  const open =
    force !== undefined ? force : !el.sidebar.classList.contains("open");
  el.sidebar.classList.toggle("open", open);
  el.overlay.classList.toggle("open", open);
  el.menuToggle.classList.toggle("open", open);
  el.menuToggle.setAttribute("aria-expanded", String(open));
}

el.menuToggle.addEventListener("click", () => toggleMenu());
el.overlay.addEventListener("click", () => toggleMenu(false));

document.querySelectorAll(".sidebar-nav a").forEach((link) => {
  link.addEventListener("click", () => toggleMenu(false));
});

// Highlight the active nav link while scrolling.
const navLinks = [...document.querySelectorAll(".sidebar-nav a")];
const sections = navLinks
  .map((l) => document.querySelector(l.getAttribute("href")))
  .filter(Boolean);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((l) =>
        l.classList.toggle("active", l.getAttribute("href") === `#${entry.target.id}`)
      );
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);

sections.forEach((s) => observer.observe(s));
