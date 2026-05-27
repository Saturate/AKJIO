"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<div className={styles.toggleBar} role="group" aria-label="Theme selector">
			<button
				className={`${styles.button} ${theme === "light" ? styles.active : ""}`}
				onClick={() => setTheme("light")}
				aria-label="Light mode"
				title="Light mode"
			>
				<Sun size={18} />
			</button>
			<button
				className={`${styles.button} ${theme === "dark" ? styles.active : ""}`}
				onClick={() => setTheme("dark")}
				aria-label="Dark mode"
				title="Dark mode"
			>
				<Moon size={18} />
			</button>
			<button
				className={`${styles.button} ${theme === "system" ? styles.active : ""}`}
				onClick={() => setTheme("system")}
				aria-label="System mode"
				title="System mode"
			>
				<Monitor size={18} />
			</button>
		</div>
	);
}
