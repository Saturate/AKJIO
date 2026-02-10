async function fetchGoogleFont(
	family: string,
	weight: number,
): Promise<ArrayBuffer> {
	// Google Fonts CSS endpoint — using a user-agent that returns .ttf
	const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;

	const cssRes = await fetch(cssUrl, {
		headers: {
			// Old IE UA to get .ttf instead of .woff2 — Satori only supports TrueType
			"User-Agent":
				"Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
		},
		next: { revalidate: 86400 },
	});

	const css = await cssRes.text();
	const match = css.match(/src:\s*url\(([^)]+)\)/);
	if (!match?.[1]) {
		throw new Error(`Could not extract font URL for ${family} ${weight}`);
	}

	const fontRes = await fetch(match[1], {
		next: { revalidate: 86400 },
	});
	return fontRes.arrayBuffer();
}

export async function loadOgFonts() {
	const [jersey400, inter400, inter600] = await Promise.all([
		fetchGoogleFont("Jersey 25", 400),
		fetchGoogleFont("Inter", 400),
		fetchGoogleFont("Inter", 600),
	]);

	return [
		{ name: "Jersey 25", data: jersey400, weight: 400 as const },
		{ name: "Inter", data: inter400, weight: 400 as const },
		{ name: "Inter", data: inter600, weight: 600 as const },
	];
}
