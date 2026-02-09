"use client";

import { useEffect, useRef } from "react";

interface ResponsiveDetailsProps {
	children: React.ReactNode;
	className?: string;
	breakpoint?: number;
}

export default function ResponsiveDetails({
	children,
	className,
	breakpoint = 1100,
}: ResponsiveDetailsProps) {
	const detailsRef = useRef<HTMLDetailsElement>(null);

	useEffect(() => {
		const details = detailsRef.current;
		if (!details) return;

		const handleResize = () => {
			if (window.innerWidth >= breakpoint) {
				details.open = true;
			}
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [breakpoint]);

	return (
		<details ref={detailsRef} className={className} open>
			{children}
		</details>
	);
}
