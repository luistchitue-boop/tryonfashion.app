"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "tryonfashion-theme";
const THEME_CHANGE_EVENT = "tryonfashion-theme-change";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function getTheme(): "light" | "dark" {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToTheme(onChange: () => void) {
  const updateTheme = () => {
    applyTheme(getTheme());
    onChange();
  };
  applyTheme(getTheme());
  window.addEventListener("storage", updateTheme);
  window.addEventListener(THEME_CHANGE_EVENT, updateTheme);
  return () => {
    window.removeEventListener("storage", updateTheme);
    window.removeEventListener(THEME_CHANGE_EVENT, updateTheme);
  };
}

const getServerTheme = () => "light" as const;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, getServerTheme);
  const isDark = theme === "dark";

  const toggleTheme = () => {
    const theme = isDark ? "light" : "dark";
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full border border-stone-300 bg-white/90 px-4 text-sm font-medium text-stone-800 shadow-lg backdrop-blur transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 disabled:opacity-70"
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      <span className="hidden sm:inline">{isDark ? "Light theme" : "Dark theme"}</span>
    </button>
  );
}
