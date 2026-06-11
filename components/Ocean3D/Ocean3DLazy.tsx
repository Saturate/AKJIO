"use client";

import dynamic from "next/dynamic";
import styles from "./Ocean3D.module.css";

const Ocean3D = dynamic(() => import("./Ocean3D"), {
	ssr: false,
});

export default function Ocean3DLazy() {
	return (
		<>
			<div className={styles.oceanPlaceholder} />
			<Ocean3D />
		</>
	);
}
