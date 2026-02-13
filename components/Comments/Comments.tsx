"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Giscus from "@giscus/react";

export default function Comments() {
	const [mounted, setMounted] = useState(false);
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	return (
		<Giscus
			repo="Saturate/AKJIO"
			repoId="MDEwOlJlcG9zaXRvcnkzMTU1MjM3NA=="
			category="Announcements"
			categoryId="DIC_kwDOAeFzds4Cq96j"
			mapping="pathname"
			reactionsEnabled="1"
			emitMetadata="0"
			inputPosition="top"
			theme={resolvedTheme === "dark" ? "dark" : "light"}
			lang="en"
			loading="lazy"
		/>
	);
}
