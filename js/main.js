import { getForecast, searchCities } from './api.js';
import { readPreferences, savePreferences } from './storage.js';
import { escapeHTML, renderLoading, renderWeather } from './render.js';

const preferences = readPreferences();
const state = {
  location: preferences.location ?? { name: 'San Diego', admin1: 'California', country: 'United States', latitude: 32.7157, longitude: -117.1611 },
  units: preferences.units,
};
const input = document.querySelector('#city-search');
const results = document.querySelector('#city-results');
const status = document.querySelector('#status');
const weather = document.querySelector('#weather');
const searchStatus = document.querySelector('#search-status');
let forecastController;
let searchController;
let searchTimer;
let cities = [];
let activeIndex = -1;
let retryAction;
let hasWeather = false;
let searchVersion = 0;

function showStatus(message, retry) {
  status.replaceChildren();
  status.hidden = !message;
  retryAction = retry;
  if (!message) return;
  const text = document.createElement('span');
  text.textContent = message;
  status.append(text);
  if (retry) {
    const button = document.createElement('button');
    button.textContent = 'Try again';
    button.addEventListener('click', retry);
    status.append(button);
  }
}

function syncUnits() {
  for (const button of document.querySelectorAll('[data-unit]')) {
    button.setAttribute('aria-pressed', String(button.dataset.unit === state.units));
  }
}

function errorMessage(error) {
  if (!navigator.onLine) return "You're offline. Reconnect to load the latest forecast.";
  if (error.name === 'TimeoutError') return 'The request took too long. Please try again.';
  if (error instanceof TypeError) return 'Could not reach the weather service. Check your connection and try again.';
  return error.message;
}

async function loadWeather(location = state.location, units = state.units, quiet = false) {
  forecastController?.abort();
  const controller = new AbortController();
  forecastController = controller;
  weather.setAttribute('aria-busy', 'true');
  if (!quiet) showStatus(hasWeather ? 'Updating your forecast...' : '');
  try {
    const { data, fetchedAt } = await getForecast(location, units, controller.signal);
    if (controller.signal.aborted) return;
    renderWeather(data, location, fetchedAt);
    state.location = location;
    state.units = units;
    syncUnits();
    savePreferences(state);
    hasWeather = true;
    weather.hidden = false;
    showStatus('');
  } catch (error) {
    if (controller.signal.aborted) return;
    if (!hasWeather) weather.hidden = true;
    showStatus(`${errorMessage(error)}${hasWeather ? ' Showing the last loaded forecast.' : ''}`, () => loadWeather(location, units));
    console.error('WeatherView forecast failed:', error);
  } finally {
    if (forecastController === controller) weather.setAttribute('aria-busy', 'false');
  }
}

function closeResults() {
  results.hidden = true;
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
  activeIndex = -1;
}

function cancelSearch() {
  clearTimeout(searchTimer);
  searchController?.abort();
  searchVersion++;
}

function chooseCity(index) {
  const city = cities[index];
  if (!city) return;
  cancelSearch();
  closeResults();
  input.value = '';
  searchStatus.textContent = `Loading weather for ${city.name}.`;
  loadWeather({ name: city.name, latitude: city.latitude, longitude: city.longitude, admin1: city.admin1, country: city.country });
}

async function search(query, version) {
  searchController = new AbortController();
  const controller = searchController;
  searchStatus.textContent = 'Searching cities...';
  try {
    const found = await searchCities(query, controller.signal);
    if (controller.signal.aborted || version !== searchVersion) return;
    cities = found;
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
    results.innerHTML = cities.map((city, i) => `<li id="city-${i}" role="option" aria-selected="false" data-index="${i}">${escapeHTML(city.name)}<small>${escapeHTML([city.admin1, city.country].filter(Boolean).join(', '))}</small></li>`).join('');
    results.hidden = !cities.length;
    input.setAttribute('aria-expanded', String(Boolean(cities.length)));
    searchStatus.textContent = cities.length ? `${cities.length} cities found. Use the arrow keys to select a city.` : 'No cities found. Try a different name.';
    if (!cities.length) showStatus('No matching cities. Try a different city name.');
    else showStatus('');
  } catch (error) {
    if (controller.signal.aborted || version !== searchVersion) return;
    closeResults();
    showStatus(errorMessage(error), () => search(query, searchVersion));
    searchStatus.textContent = 'City search failed.';
    console.error('WeatherView city search failed:', error);
  }
}

input.addEventListener('input', () => {
  cancelSearch();
  closeResults();
  const query = input.value.trim();
  if (query.length < 2) {
    searchStatus.textContent = 'Enter at least two characters to search.';
    return;
  }
  const version = searchVersion;
  searchTimer = setTimeout(() => search(query, version), 300);
});
input.addEventListener('keydown', event => {
  if (event.key === 'Escape') { cancelSearch(); closeResults(); }
  if (results.hidden) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    activeIndex = activeIndex < 0
      ? event.key === 'ArrowDown' ? 0 : cities.length - 1
      : (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + cities.length) % cities.length;
    for (const [i, option] of [...results.children].entries()) option.setAttribute('aria-selected', String(i === activeIndex));
    input.setAttribute('aria-activedescendant', `city-${activeIndex}`);
    results.children[activeIndex].scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'Enter' && activeIndex >= 0) {
    event.preventDefault();
    chooseCity(activeIndex);
  }
});
input.addEventListener('blur', () => { cancelSearch(); closeResults(); });
results.addEventListener('pointerdown', event => {
  if (event.target.closest('[data-index]')) event.preventDefault();
});
results.addEventListener('click', event => {
  const option = event.target.closest('[data-index]');
  if (option) chooseCity(Number(option.dataset.index));
});
document.addEventListener('click', event => { if (!event.target.closest('.search-wrap')) closeResults(); });

document.querySelector('#locate').addEventListener('click', () => {
  const button = document.querySelector('#locate');
  if (!navigator.geolocation) { showStatus('Your browser does not support location access. Search for a city instead.'); input.focus(); return; }
  button.disabled = true;
  showStatus('Finding your location...');
  navigator.geolocation.getCurrentPosition(position => {
    button.disabled = false;
    loadWeather({ name: 'My Location', geolocation: true, latitude: position.coords.latitude, longitude: position.coords.longitude });
  }, error => {
    button.disabled = false;
    showStatus(error.code === 1 ? 'Location access was denied. Search for a city instead.' : 'Your location could not be found. Search for a city instead.');
    input.focus();
  }, { timeout: 10000, maximumAge: 300000 });
});
for (const button of document.querySelectorAll('[data-unit]')) {
  button.addEventListener('click', () => loadWeather(state.location, button.dataset.unit));
}
window.addEventListener('offline', () => showStatus("You're offline. Displayed weather may be out of date.", () => loadWeather()));
window.addEventListener('online', () => { if (retryAction) retryAction(); else loadWeather(); });
setInterval(() => { if (!document.hidden && navigator.onLine) loadWeather(state.location, state.units, true); }, 10 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.onLine) loadWeather(state.location, state.units, true); });
document.querySelector('#year').textContent = String(new Date().getFullYear());
syncUnits();
renderLoading();
loadWeather();
