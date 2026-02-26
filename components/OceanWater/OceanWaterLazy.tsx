"use client";

import dynamic from "next/dynamic";
import styles from "./OceanWater.module.css";

const OceanWater = dynamic(() => import("./OceanWater"), {
	ssr: false,
});

export default function OceanWaterLazy() {
	return (
		<>
			<div className={styles.oceanPlaceholder} />
			<OceanWater />
		</>
	);
}
