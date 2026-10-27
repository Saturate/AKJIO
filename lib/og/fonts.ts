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
	if (!fontRes.ok) {
		throw new Error(
			`Font download failed for ${family} ${weight}: HTTP ${fontRes.status}`,
		);
	}
	return fontRes.arrayBuffer();
}

// Satori can't use variable axes, so Fraunces comes in as a static instance here.
export async function loadOgFonts() {
	const [silkscreen700, fraunces400, geist400, geist600] = await Promise.all([
		fetchGoogleFont("Silkscreen", 700),
		fetchGoogleFont("Fraunces", 400),
		fetchGoogleFont("Geist", 400),
		fetchGoogleFont("Geist", 600),
	]);

	return [
		{ name: "Silkscreen", data: silkscreen700, weight: 700 as const },
		{ name: "Fraunces", data: fraunces400, weight: 400 as const },
		{ name: "Geist", data: geist400, weight: 400 as const },
		{ name: "Geist", data: geist600, weight: 600 as const },
	];
}
