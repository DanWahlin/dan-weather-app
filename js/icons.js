const sun = '<g class="sun-rays" stroke="#f2c573" stroke-width="2.8" stroke-linecap="round"><path d="M60 13v-5m0 72v-5M29 44h-5m72 0h-5M38 22l-4-4m52 52-4-4M38 66l-4 4m52-52-4 4"/></g><circle cx="60" cy="44" r="20" fill="#f2c573"/>';
const moon = '<path d="M74 18a28 28 0 1 0 16 43 26 26 0 0 1-16-43Z" fill="#e3e9f6"/><circle cx="92" cy="25" r="2" fill="#f2c573"/><circle cx="98" cy="40" r="1.5" fill="#f2c573"/>';
const cloud = '<g class="cloud-drift"><path d="M30 70a15 15 0 1 1 3-30 23 23 0 0 1 43-2 16 16 0 1 1 7 32Z" fill="#dbe5ef"/><path d="M30 70a15 15 0 0 1-14-10c14 8 53 6 80-3a16 16 0 0 1-13 13Z" fill="#bccddd"/></g>';
export function weatherIcon(kind, className = '') {
  let content;
  switch (kind) {
    case 'clear': content = sun; break;
    case 'moon': content = moon; break;
    case 'partly': content = `<g transform="translate(24,-7) scale(.8)">${sun}</g>${cloud}`; break;
    case 'partly-night': content = `<g transform="translate(24,-7) scale(.8)">${moon}</g>${cloud}`; break;
    case 'rain': content = `${cloud}<g class="rain-streaks" stroke="#8abce8" stroke-width="3" stroke-linecap="round"><path d="m38 80-4 9m22-9-4 9m22-9-4 9"/></g>`; break;
    case 'snow': content = `${cloud}<g class="snow-flakes" fill="#e3efff"><circle cx="35" cy="84" r="3"/><circle cx="55" cy="90" r="3"/><circle cx="76" cy="82" r="3"/></g>`; break;
    case 'storm': content = `${cloud}<path class="lightning" d="m61 65-13 20h12l-5 17 22-27H64l7-10Z" fill="#f2c573"/>`; break;
    case 'fog': content = `${cloud}<g stroke="#c6d5e5" stroke-width="3" stroke-linecap="round"><path d="M25 81h64M35 90h44"/></g>`; break;
    case 'cloud': content = cloud; break;
    default: content = '<text x="60" y="65" text-anchor="middle" fill="#b6c1d0" font-size="40">?</text>';
  }
  return `<svg class="weather-icon ${className}" viewBox="0 0 120 108" aria-hidden="true">${content}</svg>`;
}

export function smallIcon(kind) {
  const paths = {
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    rain: '<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/>',
    wind: '<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind] ?? ''}</svg>`;
}
