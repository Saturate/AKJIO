"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { ColonyEngine } from "@/lib/colony/engine";
import { registerColony } from "@/lib/colony/loop";
import styles from "./Colony.module.css";

type Tag =
	"div" | "section" | "header" | "footer" | "article" | "figure" | "aside";

type ColonyProps = {
	as?: Tag;
	className?: string;
	seed: number;
	inward?: number;
	reach?: number;
	corners?: readonly number[];
	edges?: readonly number[];
	infect?: boolean;
	children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">;

const REG = ["tl", "tr", "br", "bl"] as const;
const ALL = [0, 1, 2, 3] as const;

export default function Colony({
	as = "div",
	className,
	seed,
	inward = 0.15,
	reach = 28,
	corners = ALL,
	edges = ALL,
	infect = false,
	children,
	...rest
}: ColonyProps) {
	const [node, setNode] = useState<HTMLElement | null>(null);
	const trail = useRef<HTMLCanvasElement>(null);
	const glow = useRef<HTMLCanvasElement>(null);
	const engine = useRef<ColonyEngine | null>(null);
	const cornerKey = corners.join(",");
	const edgeKey = edges.join(",");

	useEffect(() => {
		if (!node || !trail.current || !glow.current) return;
		const e = new ColonyEngine(node, trail.current, glow.current, {
			seed,
			inward,
			reach,
			corners: cornerKey ? cornerKey.split(",").map(Number) : [],
			edges: edgeKey ? edgeKey.split(",").map(Number) : [],
			infect,
		});
		engine.current = e;
		const unregister = registerColony(e);
		// pointerover bubbles, so moving between rows of a list pulses too; pulse() throttles itself.
		const onEnter = () => e.pulse(false);
		node.addEventListener("pointerover", onEnter);
		return () => {
			node.removeEventListener("pointerover", onEnter);
			unregister();
			engine.current = null;
		};
	}, [node, seed, inward, reach, cornerKey, edgeKey, infect]);

	return createElement(
		as,
		{
			...rest,
			ref: setNode,
			className: `${styles.colonized} ${className ?? ""}`,
		},
		<canvas ref={trail} className={styles.canvas} aria-hidden="true" />,
		<canvas ref={glow} className={styles.canvas} aria-hidden="true" />,
		children,
		...corners.map((ci) => (
			<span
				key={ci}
				className={`${styles.reg} ${styles[REG[ci]]}`}
				aria-hidden="true"
			/>
		)),
	);
}
