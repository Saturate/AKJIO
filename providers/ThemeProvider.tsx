"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { StrainKey } from "@/lib/strains";
import { DEFAULT_SETTINGS, SETTINGS_COOKIE, isDefaultSettings, serializeSettings, type Settings, type ThemeChoice } from "@/lib/settings";
import { setRuntimeSettings } from "@/lib/runtimeSettings";

type ResolvedTheme = "light" | "dark";

interface SettingsContextValue {
	settings: Settings;
	update: (patch: Partial<Settings>) => void;
	reset: () => void;
	resolvedTheme: ResolvedTheme;
	theme: ThemeChoice;
	setTheme: (theme: ThemeChoice) => void;
	strain: StrainKey;
	setStrain: (strain: StrainKey) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

// No cookie until someone changes a setting; going back to the defaults removes it again.
function writeCookie(s: Settings) {
	const secure = location.protocol === "https:" ? "; Secure" : "";
	document.cookie = isDefaultSettings(s)
		? `${SETTINGS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
		: `${SETTINGS_COOKIE}=${serializeSettings(s)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function applyTheme(resolved: ResolvedTheme) {
	const root = document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(resolved);
	root.style.colorScheme = resolved;
}

function systemTheme(): ResolvedTheme {
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// The server renders mode and strain from the cookie and the pre-paint script resolves "system",
// so the DOM is already right on first paint. This provider only touches it when a setting changes.
export function ThemeProvider({ initial, children }: { initial: Settings; children: React.ReactNode }) {
	const [settings, setSettings] = useState<Settings>(initial);
	const latest = useRef(initial);
	const [systemDark, setSystemDark] = useState<boolean | null>(null);

	useLayoutEffect(() => {
		setRuntimeSettings(settings);
	}, [settings]);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		setSystemDark(mq.matches);
		const onChange = (e: MediaQueryListEvent) => {
			setSystemDark(e.matches);
			if (latest.current.theme === "system") applyTheme(e.matches ? "dark" : "light");
		};
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	const update = useCallback((patch: Partial<Settings>) => {
		const next = { ...latest.current, ...patch };
		latest.current = next;
		if (patch.theme !== undefined) applyTheme(next.theme === "system" ? systemTheme() : next.theme);
		if (patch.strain !== undefined) document.documentElement.dataset.strain = next.strain;
		document.documentElement.dataset.theme = next.theme;
		writeCookie(next);
		setSettings(next);
	}, []);

	const reset = useCallback(() => update(DEFAULT_SETTINGS), [update]);
	const setTheme = useCallback((theme: ThemeChoice) => update({ theme }), [update]);
	const setStrain = useCallback((strain: StrainKey) => update({ strain }), [update]);

	const resolvedTheme: ResolvedTheme = settings.theme === "system" ? (systemDark === false ? "light" : "dark") : settings.theme;

	const value = useMemo(
		() => ({ settings, update, reset, resolvedTheme, theme: settings.theme, setTheme, strain: settings.strain, setStrain }),
		[settings, update, reset, resolvedTheme, setTheme, setStrain],
	);

	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useTheme() {
	const ctx = useContext(SettingsContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}

export const useSettings = useTheme;
