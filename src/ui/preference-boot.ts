export const LOCALE_STORAGE_KEY = 'hearth-locale'
export const THEME_STORAGE_KEY = 'hearth-theme'

export const preferenceBootScript = `(() => {
  const root = document.documentElement;
  const localeKey = ${JSON.stringify(LOCALE_STORAGE_KEY)};
  const themeKey = ${JSON.stringify(THEME_STORAGE_KEY)};
  let locale = "en";
  let theme = "light";
  try {
    const storedLocale = localStorage.getItem(localeKey);
    if (storedLocale === "es") locale = "es";
    const storedTheme = localStorage.getItem(themeKey);
    if (storedTheme === "light" || storedTheme === "dark") {
      theme = storedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch {
    locale = "en";
    theme = "light";
  }
  root.lang = locale;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();`
