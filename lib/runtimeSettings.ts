"use client";

import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

// Canvas loops live outside React; this mirrors the provider's settings for them.
let current: Settings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

export function runtimeSettings(): Settings {
	return current;
}

export function setRuntimeSettings(next: Settings): void {
	if (next === current) return;
	current = next;
	listeners.forEach((fn) => fn());
}

export function onRuntimeSettings(fn: () => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
