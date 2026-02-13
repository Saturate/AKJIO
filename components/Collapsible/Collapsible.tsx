"use client";

import * as Primitive from "@radix-ui/react-collapsible";
import { useEffect, useState, type ComponentProps } from "react";
import styles from "./Collapsible.module.css";

export const Collapsible = Primitive.Root;
export const CollapsibleTrigger = Primitive.CollapsibleTrigger;

export function CollapsibleContent({
	children,
	className,
	...props
}: ComponentProps<typeof Primitive.CollapsibleContent>) {
	const [mounted, setMounted] = useState(false);

	// Skip animation on initial render to avoid flash
	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<Primitive.CollapsibleContent
			className={`${styles.content} ${mounted ? styles.animated : ""} ${className ?? ""}`}
			{...props}
		>
			{children}
		</Primitive.CollapsibleContent>
	);
}
