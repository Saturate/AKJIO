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
	const connection = navigator.connection;
	if (!connection) return true;
	if (connection.saveData) return false;
	return connection.effectiveType !== "2g" && connection.effectiveType !== "slow-2g";
}

export default function Ocean3DLazy() {
	const [sceneEnabled, setSceneEnabled] = useState(false);

	// The three.js chunk (~130 KB gz) is decoration: wait for browser idle so
	// it never competes with content, and skip it entirely on Save-Data or
	// 2G connections - those users keep the animated CSS placeholder.
	useEffect(() => {
		if (!connectionAllowsScene()) return;
		if ("requestIdleCallback" in window) {
			const id = requestIdleCallback(() => setSceneEnabled(true), { timeout: 2000 });
			return () => cancelIdleCallback(id);
		}
		const id = setTimeout(() => setSceneEnabled(true), 200);
		return () => clearTimeout(id);
	}, []);

	return (
		<>
			<div className={styles.oceanPlaceholder} />
			{sceneEnabled && <Ocean3D />}
		</>
	);
}
