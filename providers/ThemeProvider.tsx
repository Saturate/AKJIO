"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_STRAIN, isStrainKey, type StrainKey } from "@/lib/strains";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: ResolvedTheme;
	strain: StrainKey;
	setStrain: (strain: StrainKey) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = "theme";
const STRAIN_KEY = "strain";

function isTheme(value: unknown): value is Theme {
	return value === "light" || value === "dark" || value === "system";
}

function resolveTheme(theme: Theme, systemDark: boolean): ResolvedTheme {
	if (theme === "system") return systemDark ? "dark" : "light";
	return theme;
}

function readStorage(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Private mode or blocked storage: the choice just won't persist.
	}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [strain, setStrainState] = useState<StrainKey>(DEFAULT_STRAIN);
	const [systemDark, setSystemDark] = useState(false);

	useEffect(() => {
		const storedTheme = readStorage(THEME_KEY);
		if (isTheme(storedTheme)) setThemeState(storedTheme);
		const storedStrain = readStorage(STRAIN_KEY);
		if (isStrainKey(storedStrain)) setStrainState(storedStrain);

		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		setSystemDark(mq.matches);
		const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	const resolved = resolveTheme(theme, systemDark);

	useEffect(() => {
		const root = document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(resolved);
		root.style.colorScheme = resolved;
	}, [resolved]);

	useEffect(() => {
		document.documentElement.dataset.strain = strain;
	}, [strain]);

	const setTheme = useCallback((t: Theme) => {
		setThemeState(t);
		writeStorage(THEME_KEY, t);
	}, []);

	const setStrain = useCallback((s: StrainKey) => {
		setStrainState(s);
		writeStorage(STRAIN_KEY, s);
	}, []);

	const value = useMemo(
		() => ({ theme, setTheme, resolvedTheme: resolved, strain, setStrain }),
		[theme, setTheme, resolved, strain, setStrain],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}
