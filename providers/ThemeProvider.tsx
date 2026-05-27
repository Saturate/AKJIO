"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";

function resolveTheme(theme: Theme, systemDark: boolean): ResolvedTheme {
	if (theme === "system") return systemDark ? "dark" : "light";
	return theme;
}

function applyTheme(resolved: ResolvedTheme) {
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);
	document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [systemDark, setSystemDark] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		setSystemDark(mq.matches);
		if (stored === "light" || stored === "dark" || stored === "system") {
			setThemeState(stored);
		}
		const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	const resolved = resolveTheme(theme, systemDark);

	useEffect(() => {
		applyTheme(resolved);
	}, [resolved]);

	const setTheme = useCallback((t: Theme) => {
		setThemeState(t);
		localStorage.setItem(STORAGE_KEY, t);
	}, []);

	const value = useMemo(() => ({ theme, setTheme, resolvedTheme: resolved }), [theme, setTheme, resolved]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}
