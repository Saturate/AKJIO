"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { pulseAll } from "@/lib/colony/loop";
import { prefersReducedMotion } from "@/lib/motion";
import styles from "./PageWipe.module.css";

const BANDS = 9;
// Survives template remounts; null until the first page has rendered.
let lastPath: string | null = null;

// On client navigations only: scanline bands peel away from alternating sides, one rgb-split frame
// on the new content, then every colony pulses. First load and same-path remounts are skipped.
// Both effects end themselves on animationend rather than timers, because effect cleanup (and
// React's double-invoke in development) would cancel the timers and leave the overlay stuck.
export default function PageWipe({ targetId }: { targetId: string }) {
	const pathname = usePathname();
	const [play, setPlay] = useState(false);

	useEffect(() => {
		const previous = lastPath;
		lastPath = pathname;
		if (previous === null || previous === pathname || prefersReducedMotion()) return;
		setPlay(true);
		const target = document.getElementById(targetId);
		if (target) {
			const done = (e: AnimationEvent) => {
				if (e.target !== target) return;
				target.classList.remove(styles.rgb);
				target.removeEventListener("animationend", done);
			};
			target.addEventListener("animationend", done);
			target.classList.add(styles.rgb);
		}
		window.setTimeout(pulseAll, 450);
	}, [pathname, targetId]);

	if (!play) return null;
	return createPortal(
		<div className={styles.wipe} aria-hidden="true">
			{Array.from({ length: BANDS }, (_, i) => (
				<i
					key={i}
					className={i % 2 ? styles.right : styles.left}
					style={{ animationDelay: `${i * 24 + (i % 3) * 16}ms` }}
					onAnimationEnd={i === BANDS - 1 ? () => setPlay(false) : undefined}
				/>
			))}
		</div>,
		document.body,
	);
}
