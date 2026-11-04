const key = 'weatherview-preferences';
export function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}');
    const location = value?.location;
    return {
      units: value?.units === 'metric' ? 'metric' : 'imperial',
      location: location && typeof location.name === 'string' &&
        Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90 &&
        Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180 ? location : null,
    };
  } catch (error) {
    console.warn('WeatherView could not read saved preferences:', error);
    return { units: 'imperial', location: null };
  }
}
export function savePreferences(value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { console.warn('WeatherView could not save preferences:', error); }
}
