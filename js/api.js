const cache = new Map();
const TTL = 10 * 60 * 1000;

async function request(url, signal) {
  const timeout = AbortSignal.timeout(15000);
  const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!response.ok) throw new Error(response.status === 429
    ? 'Too many requests. Please wait a moment and try again.'
    : `The weather service is unavailable (${response.status}). Please try again.`);
  const data = await response.json();
  if (data.error) throw new Error('The weather service could not process this request.');
  return data;
}

export async function searchCities(query, signal) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name: query, count: '5', language: 'en', format: 'json' });
  const data = await request(url, signal);
  return (data.results ?? []).filter(city => Number.isFinite(city.latitude) && Number.isFinite(city.longitude));
}

export async function getForecast(location, units, signal) {
  const key = `${location.latitude}|${location.longitude}|${units}`;
  const saved = cache.get(key);
  if (saved && Date.now() - saved.fetchedAt < TTL) return saved;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: location.latitude, longitude: location.longitude,
    current: 'temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max',
    temperature_unit: units === 'metric' ? 'celsius' : 'fahrenheit',
    wind_speed_unit: units === 'metric' ? 'kmh' : 'mph',
    precipitation_unit: units === 'metric' ? 'mm' : 'inch',
    timezone: 'auto', forecast_days: '5',
  });
  const data = await request(url, signal);
  if (!data.current || !data.daily || !Array.isArray(data.daily.time) || data.daily.time.length !== 5 ||
      !data.current_units || !data.daily_units || !data.timezone) {
    throw new Error('The weather service returned an incomplete forecast. Please try again.');
  }
  const result = { data, fetchedAt: Date.now() };
  // Bound memory use when exploring many locations.
  if (cache.size >= 30) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  return result;
}
