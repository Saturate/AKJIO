"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { STRAINS, STRAIN_KEYS } from "@/lib/strains";
import styles from "./StrainPicker.module.css";

const NEXT_THEME = { system: "dark", dark: "light", light: "system" } as const;
const THEME_LABEL = { system: "Auto", dark: "Dark", light: "Light" } as const;

function isTyping(target: EventTarget | null): boolean {
	return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

// Strain swatches in the footer, plus global shortcuts: s cycles strains, t cycles the theme.
export default function StrainPicker() {
	const { strain, setStrain, theme, setTheme, resolvedTheme } = useTheme();
	const [announce, setAnnounce] = useState("");

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e.target)) return;
			if (e.key === "s") {
				const next = STRAIN_KEYS[(STRAIN_KEYS.indexOf(strain) + 1) % STRAIN_KEYS.length];
				setStrain(next);
				setAnnounce(`Strain: ${STRAINS[next].name}`);
			} else if (e.key === "t") {
				const next = NEXT_THEME[theme];
				setTheme(next);
				setAnnounce(`Theme: ${THEME_LABEL[next]}`);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [strain, setStrain, theme, setTheme]);

	return (
		<div className={styles.picker}>
			<div className={styles.dots} role="radiogroup" aria-label="Color strain">
				{STRAIN_KEYS.map((key) => {
					const t = STRAINS[key][resolvedTheme];
					return (
						<button
							key={key}
							type="button"
							role="radio"
							aria-checked={key === strain}
							aria-label={STRAINS[key].name}
							title={STRAINS[key].name}
							className={styles.dot}
							style={{ "--sbg": t.bg, "--sacc": t.accent }}
							onClick={() => setStrain(key)}
						/>
					);
				})}
			</div>
			<span className={styles.name}>{STRAINS[strain].name}</span>
			<span className={styles.hint}>
				<kbd>s</kbd> strain · <kbd>t</kbd> theme
			</span>
			<span className={styles.sr} aria-live="polite">
				{announce}
			</span>
		</div>
	);
}
