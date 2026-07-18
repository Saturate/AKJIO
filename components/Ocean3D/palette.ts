// Day/night color palettes for the ocean scene. applyPalette() in
// Ocean3D.tsx lerps between the two on theme change.

export interface Palette {
	skyTop: number;
	skyHorizon: number;
	fog: number;
	waterNear: number;
	waterFar: number;
	glassShallow: number;
	glassDeep: number;
	foam: number;
	sun: number;
	sunGlow: number;
	glowOpacity: number;
	rock: number;
	underGeo: number;
	hemiSky: number;
	hemiGround: number;
	hemiIntensity: number;
	dirColor: number;
	dirIntensity: number;
	starsOpacity: number;
	starCount: number;
	beaconIntensity: number;
	glint: number;
	seaweed: number;
	starfish: number;
	cloudColor: number;
	cloudOpacity: number;
	cloudCount: number;
}

export const DAY: Palette = {
	skyTop: 0x837093,
	skyHorizon: 0xf2dcc4,
	fog: 0x5ea7d8,
	waterNear: 0x4f9dd6,
	waterFar: 0xa8cbdd,
	glassShallow: 0x5fb0e4,
	glassDeep: 0x123f6b,
	foam: 0xeaf6ff,
	sun: 0xfff0d0,
	sunGlow: 0xffd9a0,
	glowOpacity: 0.6,
	rock: 0x97a98f,
	underGeo: 0xbcdcee,
	hemiSky: 0xe2d8c8,
	hemiGround: 0x4a7896,
	hemiIntensity: 1.1,
	dirColor: 0xffe4be,
	dirIntensity: 1.4,
	starsOpacity: 0,
	starCount: 0,
	beaconIntensity: 2,
	glint: 0.55,
	seaweed: 0x3a7a5e,
	starfish: 0xcf7d52,
	cloudColor: 0xfff4e6,
	cloudOpacity: 0.8,
	cloudCount: 8,
};

export const NIGHT: Palette = {
	skyTop: 0x081426,
	skyHorizon: 0x1c3a54,
	fog: 0x0e2638,
	waterNear: 0x1c4470,
	waterFar: 0x1f4060,
	glassShallow: 0x16406a,
	glassDeep: 0x081826,
	foam: 0x7396ac,
	sun: 0xf2f4e0,
	sunGlow: 0xbcd4e8,
	glowOpacity: 0.3,
	rock: 0x5a6a60,
	underGeo: 0x3a5e7a,
	hemiSky: 0x4f739c,
	hemiGround: 0x1c3452,
	hemiIntensity: 1.65,
	dirColor: 0xc4d8ec,
	dirIntensity: 1.25,
	starsOpacity: 0.9,
	starCount: 500,
	beaconIntensity: 30,
	glint: 0.3,
	seaweed: 0x1f4a42,
	starfish: 0x70453a,
	cloudColor: 0x27364a,
	cloudOpacity: 0.15,
	cloudCount: 4,
};
