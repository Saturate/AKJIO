"use client";

import { useEffect, useRef } from "react";
import styles from "./ScrollProgress.module.css";

export default function ScrollProgress() {
	const ref = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		let raf = 0;
		const update = () => {
			raf = 0;
			const max = document.documentElement.scrollHeight - window.innerHeight;
			el.style.setProperty(
				"--p",
				max > 0 ? String(Math.min(1, window.scrollY / max)) : "0",
			);
		};
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(update);
		};
		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			cancelAnimationFrame(raf);
		};
	}, []);

	return <span ref={ref} className={styles.progress} aria-hidden="true" />;
}
