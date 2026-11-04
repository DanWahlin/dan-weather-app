import { weatherCode } from './weather-codes.js';
import { weatherIcon, smallIcon } from './icons.js';

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const numeric = value => typeof value === 'number' && Number.isFinite(value);
const rounded = value => numeric(value) ? String(Math.round(value)) : '\u2014';
const temperature = value => `${rounded(value)}${numeric(value) ? '\u00b0' : ''}`;
const measurement = (value, unit) => numeric(value) ? `${rounded(value)} ${escapeHTML(unit)}` : '\u2014';
const date = value => new Date(`${value}T12:00:00Z`);
const dateLabel = (value, options) => new Intl.DateTimeFormat('en', { ...options, timeZone: 'UTC' }).format(date(value));
const windUnit = units => units === 'mp/h' ? 'mph' : units;

export function renderLoading() {
  document.querySelector('#forecast').innerHTML = Array.from({ length: 5 }, () =>
    '<div class="day-card skeleton" aria-hidden="true"><div class="skeleton-line"></div><div class="skeleton-line large"></div><div class="skeleton-line"></div></div>').join('');
}

export function renderWeather(data, location, fetchedAt) {
  const current = data.current;
  const daily = data.daily;
  const today = daily.time[0];
  const sunrise = daily.sunrise?.[0];
  const sunset = daily.sunset?.[0];
  // Open-Meteo's local ISO timestamps can be compared without browser timezone conversion.
  const night = sunrise && sunset
    ? current.time < sunrise || current.time >= sunset
    : current.is_day === 0;
  const condition = weatherCode(current.weather_code, night);
  const hero = document.querySelector('#hero');
  hero.classList.remove('skeleton');
  hero.dataset.palette = condition.palette;
  hero.dataset.night = String(night);
  const detail = location.geolocation
    ? `Time zone: ${data.timezone.replaceAll('_', ' ')} \u00b7 ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`
    : [location.admin1, location.country].filter(Boolean).join(', ');
  hero.innerHTML = `
    <div class="hero-top"><div><h2 class="place">${smallIcon('pin')}${escapeHTML(location.name)}</h2><p class="place-detail">${escapeHTML(detail)} &middot; ${escapeHTML(dateLabel(today, { weekday: 'long', month: 'long', day: 'numeric' }))}</p></div><span class="live">CURRENT WEATHER</span></div>
    <div class="hero-body"><div class="conditions"><div class="temperature">${temperature(current.temperature_2m)}<sup>${escapeHTML((data.current_units.temperature_2m ?? '').replace('\u00b0', ''))}</sup></div><div><p class="condition-description">${condition.label}</p><p class="feels">Feels like ${measurement(current.apparent_temperature, data.current_units.apparent_temperature)}</p></div></div>${weatherIcon(condition.icon, 'hero-icon')}</div>
    <div class="hero-bottom"><div class="current-metrics"><span>Wind<strong>${measurement(current.wind_speed_10m, windUnit(data.current_units.wind_speed_10m))}</strong></span><span>Humidity<strong>${measurement(current.relative_humidity_2m, data.current_units.relative_humidity_2m)}</strong></span><span>High / Low<strong>${temperature(daily.temperature_2m_max?.[0])} / ${temperature(daily.temperature_2m_min?.[0])}</strong></span></div><span class="hero-caption">A moment outside starts here.</span></div>`;

  const lows = (daily.temperature_2m_min ?? []).filter(numeric);
  const highs = (daily.temperature_2m_max ?? []).filter(numeric);
  const min = lows.length ? Math.min(...lows) : 0;
  const max = highs.length ? Math.max(...highs) : min;
  const span = max - min || 1;
  document.querySelector('#forecast').innerHTML = daily.time.map((day, i) => {
    const info = weatherCode(daily.weather_code?.[i]);
    const low = daily.temperature_2m_min?.[i];
    const high = daily.temperature_2m_max?.[i];
    const left = numeric(low) ? Math.max(0, Math.min(100, (low - min) / span * 100)) : 0;
    const width = numeric(high) && numeric(low) ? Math.max(0, Math.min(100 - left, (high - low) / span * 100)) : 0;
    return `<article class="day-card ${i === 0 ? 'today' : ''}" style="--index:${i}" aria-label="${escapeHTML(dateLabel(day, { weekday: 'long', month: 'long', day: 'numeric' }))}">
      <div class="card-heading"><h3>${i === 0 ? 'Today' : escapeHTML(dateLabel(day, { weekday: 'long' }))}</h3>${i === 0 ? '<span class="today-tag">NOW</span>' : ''}</div>
      <p class="card-date">${escapeHTML(dateLabel(day, { month: 'short', day: 'numeric' }))}</p>
      ${weatherIcon(info.icon)}<p class="day-condition">${info.label}</p>
      <div class="temps"><strong><span class="sr-only">High </span>${temperature(high)}</strong><span><span class="sr-only">Low </span>${temperature(low)}</span></div>
      <div class="range-track" aria-hidden="true"><div class="range-fill" style="margin-left:${left}%;width:${width}%"></div></div>
      <div class="card-metrics">
        <div class="metric-row">${smallIcon('rain')}<span>Rain chance</span><span class="value">${measurement(daily.precipitation_probability_max?.[i], data.daily_units.precipitation_probability_max)}</span></div>
        <div class="metric-row">${smallIcon('wind')}<span>Wind</span><span class="value">${measurement(daily.wind_speed_10m_max?.[i], windUnit(data.daily_units.wind_speed_10m_max))}</span></div>
        <div class="metric-row">${smallIcon('sun')}<span>UV index</span><span class="value">${rounded(daily.uv_index_max?.[i])}</span></div>
      </div></article>`;
  }).join('');
  document.querySelector('#updated').textContent = `Updated ${new Intl.DateTimeFormat('en', {
    hour: 'numeric', minute: '2-digit', timeZone: data.timezone, timeZoneName: 'short',
  }).format(fetchedAt)} \u00b7 Local time`;
}
