"use client";

import { useRef } from "react";
import Colony from "@/components/Colony/Colony";
import { scramble } from "@/lib/motion";
import { hashStr } from "@/lib/random";
import styles from "./CodeFrame.module.css";

type CodeFrameProps = {
	language: string | null;
	hasTitle: boolean;
	seedText: string;
	children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export default function CodeFrame({ language, hasTitle, seedText, children, ...rest }: CodeFrameProps) {
	const label = useRef<HTMLSpanElement>(null);

	const copy = async (e: React.MouseEvent<HTMLButtonElement>) => {
		const pre = e.currentTarget.closest("figure")?.querySelector("pre");
		if (!pre) return;
		try {
			await navigator.clipboard.writeText(pre.innerText);
		} catch {
			return;
		}
		const el = label.current;
		if (!el) return;
		scramble(el, "Copied");
		window.setTimeout(() => scramble(el, "Copy"), 1400);
	};

	return (
		<Colony as="figure" seed={hashStr(seedText)} inward={0.2} reach={22} className={styles.frame} {...rest}>
			{!hasTitle && <div className={styles.bar}>{language && language !== "plaintext" ? language : "code"}</div>}
			<button type="button" className={`${styles.copy} grow-underline`} onClick={copy} aria-label="Copy code">
				<span ref={label} aria-live="polite">
					Copy
				</span>
			</button>
			{children}
		</Colony>
	);
}
