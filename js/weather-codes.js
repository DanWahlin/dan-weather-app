const groups = [
  [[0], 'Clear sky', 'clear', 'clear'],
  [[1], 'Mainly clear', 'partly', 'clear'],
  [[2], 'Partly cloudy', 'partly', 'cloud'],
  [[3], 'Overcast', 'cloud', 'cloud'],
  [[45, 48], 'Foggy', 'fog', 'cloud'],
  [[51, 53, 55], 'Drizzle', 'rain', 'rain'],
  [[56, 57], 'Freezing drizzle', 'rain', 'rain'],
  [[61, 63, 65], 'Rain', 'rain', 'rain'],
  [[66, 67], 'Freezing rain', 'rain', 'rain'],
  [[71, 73, 75, 77], 'Snow', 'snow', 'snow'],
  [[80, 81, 82], 'Rain showers', 'rain', 'rain'],
  [[85, 86], 'Snow showers', 'snow', 'snow'],
  [[95], 'Thunderstorm', 'storm', 'storm'],
  [[96, 99], 'Thunder & hail', 'storm', 'storm'],
];
const codes = new Map(groups.flatMap(([numbers, label, icon, palette]) =>
  numbers.map(code => [code, { label, icon, palette }])));

export function weatherCode(code, night = false) {
  const result = codes.get(code) ?? { label: 'Unavailable', icon: 'unknown', palette: 'cloud' };
  if (!night) return result;
  return { ...result, label: code === 0 ? 'Clear night' : result.label,
    icon: result.icon === 'clear' ? 'moon' : result.icon === 'partly' ? 'partly-night' : result.icon };
}
