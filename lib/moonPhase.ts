// Synodic period algorithm — accurate within a few hours, good enough for visuals.
// Reference new moon: Jan 6, 2000 18:14 UTC
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 86_400_000;
const SYNODIC_PERIOD = 29.53059;

/** Returns 0–1 representing the current lunar phase (0 ≈ new moon, ~0.5 ≈ full moon). */
export function getMoonPhase(date: Date = new Date()): number {
	const daysSinceEpoch = date.getTime() / 86_400_000;
	const daysSinceNewMoon = daysSinceEpoch - KNOWN_NEW_MOON;
	return ((daysSinceNewMoon % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD / SYNODIC_PERIOD;
}

/** Returns 0–1 representing how lit the moon is (0 = new, 1 = full). */
export function getIlluminationFraction(phase: number): number {
	return (1 - Math.cos(phase * 2 * Math.PI)) / 2;
}
