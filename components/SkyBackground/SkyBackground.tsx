"use client";

import { useEffect, useRef } from "react";
import styles from "./SkyBackground.module.css";

export default function SkyBackground() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Add parallax scroll effect
		const handleScroll = () => {
			const scrollY = window.scrollY;
			container.style.transform = `translateY(${scrollY * 0.3}px)`;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div ref={containerRef} className={styles.skyBackground}>
			<div className={styles.cloud} style={{ left: "10%", top: "20%", animationDelay: "0s" }} />
			<div className={styles.cloud} style={{ left: "35%", top: "40%", animationDelay: "2s" }} />
			<div className={styles.cloud} style={{ left: "60%", top: "25%", animationDelay: "4s" }} />
			<div className={styles.cloud} style={{ left: "80%", top: "35%", animationDelay: "6s" }} />
		</div>
	);
}
