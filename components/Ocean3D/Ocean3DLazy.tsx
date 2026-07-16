"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import styles from "./Ocean3D.module.css";

// Network Information API: not yet in lib.dom, narrow via augmentation.
declare global {
	interface Navigator {
		connection?: {
			saveData?: boolean;
			effectiveType?: string;
		};
	}
}

const Ocean3D = dynamic(() => import("./Ocean3D"), {
	ssr: false,
});

function connectionAllowsScene(): boolean {
	// Escape hatch to preview/force the CSS-only background: ?css
	if (new URLSearchParams(window.location.search).has("css")) return false;
	const connection = navigator.connection;
	if (!connection) return true;
	if (connection.saveData) return false;
	return connection.effectiveType !== "2g" && connection.effectiveType !== "slow-2g";
}

export default function Ocean3DLazy() {
	const [mode, setMode] = useState<"loading" | "scene" | "css">("loading");

	// The three.js chunk (~130 KB gz) is decoration: wait for browser idle so
	// it never competes with content, and skip it entirely on Save-Data or
	// 2G connections - those users get the standalone CSS ocean instead.
	useEffect(() => {
		if (!connectionAllowsScene()) {
			setMode("css");
			return;
		}
		if ("requestIdleCallback" in window) {
			const id = requestIdleCallback(() => setMode("scene"), { timeout: 2000 });
			return () => cancelIdleCallback(id);
		}
		const id = setTimeout(() => setMode("scene"), 200);
		return () => clearTimeout(id);
	}, []);

	const placeholderClass =
		mode === "css"
			? `${styles.oceanPlaceholder} ${styles.oceanPlaceholderPermanent}`
			: styles.oceanPlaceholder;

	return (
		<>
			<div className={placeholderClass} />
			{mode === "scene" && <Ocean3D />}
		</>
	);
}
