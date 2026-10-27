"use client";

import { useTheme } from "@/providers/ThemeProvider";
import styles from "./ThemeToggle.module.css";

const NEXT = { system: "dark", dark: "light", light: "system" } as const;
const LABEL = { system: "Auto", dark: "Dark", light: "Light" } as const;
const GLYPH = { system: "◎", dark: "◐", light: "◑" } as const;

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const next = NEXT[theme];

	return (
		<button
			type="button"
			className={`${styles.toggle} grow-underline`}
			onClick={() => setTheme(next)}
			aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}`}
			title={`Switch to ${LABEL[next]}`}
		>
			<span aria-hidden="true">{GLYPH[theme]}</span> {LABEL[theme]}
		</button>
	);
}
