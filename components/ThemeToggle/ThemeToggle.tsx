"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	// Prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className={styles.toggleBar} aria-hidden="true">
				<button className={styles.button} disabled>
					<Sun size={18} />
				</button>
				<button className={styles.button} disabled>
					<Moon size={18} />
				</button>
				<button className={styles.button} disabled>
					<Monitor size={18} />
				</button>
			</div>
		);
	}

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
