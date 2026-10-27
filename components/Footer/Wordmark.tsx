"use client";

import { useEffect, useRef } from "react";
import styles from "./Footer.module.css";

// Wide screens: the mark runs vertically and is sized to the footer row height, then its column
// takes the resulting width. Narrow screens: it lies flat and fills the width.
export default function Wordmark() {
	const cellRef = useRef<HTMLDivElement>(null);
	const markRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const cell = cellRef.current;
		const mark = markRef.current;
		const span = mark?.firstElementChild;
		const grid = cell?.parentElement;
		if (!cell || !mark || !(span instanceof HTMLElement) || !grid) return;

		const fit = () => {
			const vertical = getComputedStyle(mark).writingMode.startsWith("vertical");
			mark.style.fontSize = "100px";
			const r = span.getBoundingClientRect();
			if (vertical) {
				const avail = cell.clientHeight;
				if (!r.height || !avail) return;
				mark.style.fontSize = Math.floor((100 * avail) / r.height * 0.995) + "px";
				cell.style.setProperty("--wm-w", Math.ceil(mark.getBoundingClientRect().width) + "px");
			} else {
				const avail = cell.clientWidth;
				if (r.width && avail) mark.style.fontSize = Math.floor((100 * avail) / r.width * 0.995) + "px";
			}
		};

		const ro = new ResizeObserver(fit);
		ro.observe(grid);
		document.fonts.ready.then(fit);
		return () => ro.disconnect();
	}, []);

	return (
		<div ref={cellRef} className={styles.wmCell} aria-hidden="true">
			<div ref={markRef} className={styles.wordmark}>
				<span>akj.io</span>
			</div>
		</div>
	);
}
