"use client";

import { useState } from "react";

interface SpoilerProps {
	children: React.ReactNode;
}

export default function Spoiler({ children }: SpoilerProps) {
	const [revealed, setRevealed] = useState(false);

	return (
		<span
			className={`spoiler ${revealed ? "revealed" : ""}`}
			onClick={() => setRevealed(true)}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					setRevealed(true);
				}
			}}
		>
			{children}
		</span>
	);
}
