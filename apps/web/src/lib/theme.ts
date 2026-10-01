import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('pockt-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  }
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export const currentTheme = writable<Theme>(getInitialTheme());

export function initTheme() {
  if (!browser) return;
  const theme = getInitialTheme();
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  currentTheme.set(theme);
  if (browser && typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pockt-theme', theme);
  }
}

export function toggleTheme() {
  currentTheme.update((prev) => {
    const next = prev === 'light' ? 'dark' : 'light';
    if (browser && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('pockt-theme', next);
    }
    return next;
  });
}
