export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const OG_SCALE = 1;
export const OG_RENDER_WIDTH = OG_WIDTH * OG_SCALE;
export const OG_RENDER_HEIGHT = OG_HEIGHT * OG_SCALE;

// Dark mode palette from global-styles.css
export const colors = {
	skyTop: "#050814",
	waterTop: "#1a2a4a",
	waterTransition: "#243556",
	waterMedium: "#2d4264",
	waterBottom: "#385070",
	waterBodyTop: "#2d4264",
	waterBodyMid: "#1e2f4d",
	waterBodyDeep: "#0f1a2e",
	text: "#fbf1f1",
	textMuted: "#8ba3c0",
	accent: "#5a9fc7",
	tagBg: "rgba(90, 159, 199, 0.2)",
	tagBorder: "rgba(90, 159, 199, 0.4)",
} as const;
