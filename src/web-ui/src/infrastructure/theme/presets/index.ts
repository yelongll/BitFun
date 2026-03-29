export { bitfunDarkTheme } from './dark-theme';
export { bitfunLightTheme } from './light-theme';
export { bitfunMidnightTheme } from './midnight-theme';
export { bitfunChinaStyleTheme } from './china-style-theme';
export { bitfunChinaNightTheme } from './china-night-theme';
export { bitfunCyberTheme } from './cyber-theme';
export { bitfunSlateTheme } from './slate-theme';
export { bitfunNordTheme } from './nord-theme';
export { bitfunDraculaTheme } from './dracula-theme';
export { bitfunSolarizedLightTheme } from './solarized-light-theme';
export { bitfunSolarizedDarkTheme } from './solarized-dark-theme';
export { bitfunOneDarkTheme } from './one-dark-theme';
export { bitfunTokyoNightTheme } from './tokyo-night-theme';
export { bitfunGitHubLightTheme } from './github-light-theme';

import { bitfunDarkTheme } from './dark-theme';
import { bitfunLightTheme } from './light-theme';
import { bitfunMidnightTheme } from './midnight-theme';
import { bitfunChinaStyleTheme } from './china-style-theme';
import { bitfunChinaNightTheme } from './china-night-theme';
import { bitfunCyberTheme } from './cyber-theme';
import { bitfunSlateTheme } from './slate-theme';
import { bitfunNordTheme } from './nord-theme';
import { bitfunDraculaTheme } from './dracula-theme';
import { bitfunSolarizedLightTheme } from './solarized-light-theme';
import { bitfunSolarizedDarkTheme } from './solarized-dark-theme';
import { bitfunOneDarkTheme } from './one-dark-theme';
import { bitfunTokyoNightTheme } from './tokyo-night-theme';
import { bitfunGitHubLightTheme } from './github-light-theme';
import { ThemeConfig, ThemeId } from '../types';

export const DEFAULT_LIGHT_THEME_ID: ThemeId = 'bitfun-light';
export const DEFAULT_DARK_THEME_ID: ThemeId = 'bitfun-dark';

export function getSystemPreferredDefaultThemeId(): ThemeId {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return DEFAULT_LIGHT_THEME_ID;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? DEFAULT_DARK_THEME_ID
    : DEFAULT_LIGHT_THEME_ID;
}

export const DEFAULT_THEME_ID: ThemeId = DEFAULT_LIGHT_THEME_ID;

export const builtinThemes: ThemeConfig[] = [
  bitfunLightTheme,
  bitfunSlateTheme,
  bitfunDarkTheme,
  bitfunMidnightTheme,
  bitfunChinaStyleTheme,
  bitfunChinaNightTheme,
  bitfunCyberTheme,
  bitfunNordTheme,
  bitfunDraculaTheme,
  bitfunSolarizedLightTheme,
  bitfunSolarizedDarkTheme,
  bitfunOneDarkTheme,
  bitfunTokyoNightTheme,
  bitfunGitHubLightTheme,
];
