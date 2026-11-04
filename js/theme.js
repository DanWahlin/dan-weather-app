(() => {
  const key = 'weatherview-theme';
  const root = document.documentElement;
  let theme = 'dark';
  try {
    if (localStorage.getItem(key) === 'light') theme = 'light';
  } catch (error) {
    console.warn('WeatherView could not read the saved theme:', error);
  }

  function applyTheme() {
    root.dataset.theme = theme;
    document.querySelector('meta[name=theme-color]').content = theme === 'light' ? '#f3f6fa' : '#101b2c';
  }

  // Apply before styles load so a saved light theme does not flash dark.
  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#theme-toggle');
    function syncButton() {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
    }
    syncButton();
    button.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      syncButton();
      try { localStorage.setItem(key, theme); }
      catch (error) { console.warn('WeatherView could not save the theme:', error); }
    });
  });
})();
