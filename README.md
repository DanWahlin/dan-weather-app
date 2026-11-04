# WeatherView

A responsive, dark-first weather dashboard built with HTML, CSS, and native
JavaScript modules. No build step, dependencies, API keys, or backend.

## Run locally

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000. Native modules require HTTP rather than opening
`index.html` directly. Location access requires localhost or HTTPS.

## Features

- Current conditions and five-day forecast (today plus the next four days).
- Keyboard-accessible city autocomplete and optional browser geolocation.
- Fahrenheit/mph and Celsius/km/h units; preferences saved locally.
- Accessible light/dark theme toggle with a saved preference. Dark is the
  default; saved themes apply before styles load to prevent a theme flash.
- CSS-animated SVG weather icons with reduced-motion support.
- Responsive cards, skeleton loading, explicit errors and retry, null-safe values.
- Ten-minute in-memory forecast cache, request cancellation, 15-second network
  timeout, and automatic refresh while the page is visible.

The initial city is San Diego; location is never requested without a click.
Geolocation is labeled "My Location" with coordinates and the API's time zone,
not a guessed city. No reverse-geocoding provider or analytics is used.

## Structure

`js/main.js` handles state and interaction; `api.js` handles requests and cache;
`render.js` builds the weather display; `weather-codes.js` maps WMO conditions;
`icons.js` supplies decorative SVGs; `storage.js` handles preferences.
CSS is separated into tokens, base styles, components, and icon animations.
`js/theme.js` initializes the theme independently of weather requests, with a
separate storage key so location and unit updates cannot overwrite it. Light
mode uses light surfaces while preserving the condition-driven weather hero.

Dates use the forecast location's calendar day, not the browser's time zone.
Day/night styling compares the API's local sunrise, sunset, and current time.
Unknown conditions and missing measurements are explicitly shown as unavailable.
The unit toggle only commits after a successful response, so labels and data
cannot disagree. Errors preserve previously loaded weather with a warning.

No PWA/offline forecast storage, hourly charts, or automated test
toolchain is included in this version. Google Fonts loads Inter with a system
font fallback; all weather icons are local.

## Data and attribution

Weather data: [Open-Meteo](https://open-meteo.com/), licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
City search: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api),
based on [GeoNames](https://www.geonames.org/).

Endpoints:

- `https://api.open-meteo.com/v1/forecast`
- `https://geocoding-api.open-meteo.com/v1/search`

The free API is for non-commercial use and is subject to rate limits. Check
[the terms](https://open-meteo.com/en/terms) before commercial deployment.
Weather forecasts are estimates, not safety-critical guidance.
