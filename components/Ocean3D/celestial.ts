import {
	AdditiveBlending,
	BackSide,
	BufferGeometry,
	CanvasTexture,
	CircleGeometry,
	Color,
	Float32BufferAttribute,
	Group,
	Mesh,
	MeshBasicMaterial,
	Points,
	PointsMaterial,
	ShaderMaterial,
	SphereGeometry,
	Sprite,
	SpriteMaterial,
} from "three";
import { getMoonPhase, getIlluminationFraction } from "@/lib/moonPhase";
import { DAY, NIGHT } from "./palette";
import { mulberry32 } from "./random";
import { makeMoonTexture } from "./textures";
import { SKY_VERT, SKY_FRAG } from "./shaders";
import type { SceneCtx } from "./types";

// Feature flag: render the actual lunar phase instead of a permanent full
// moon. Ported from the feat/real-moon-phases branch of the 2D canvas site.
const REAL_MOON_PHASES = process.env.NEXT_PUBLIC_REAL_MOON_PHASES === "true";

const SUN_ARC_RADIUS = 30;
const MOON_ARC_RADIUS = 26;
// How far past the horizon a body swings when it sets; applyPalette
// rotates the pivots by mix * SET_ANGLE on theme change.
export const SET_ANGLE = 0.7 * Math.PI;

export function buildSky(ctx: SceneCtx, skyTopColor: Color, skyHorizonColor: Color) {
	const { scene, track } = ctx;
	const skyMat = track(
		new ShaderMaterial({
			uniforms: {
				uTop: { value: skyTopColor },
				uHorizon: { value: skyHorizonColor },
			},
			vertexShader: SKY_VERT,
			fragmentShader: SKY_FRAG,
			side: BackSide,
			fog: false,
			depthWrite: false,
		}),
	);
	const sky = new Mesh(track(new SphereGeometry(300, 24, 12)), skyMat);
	scene.add(sky);

	const STAR_MAX = 1000;
	const starRand = mulberry32(7);
	const starPositions: number[] = [];
	const starSizes: number[] = [];
	for (let i = 0; i < STAR_MAX; i++) {
		const theta = starRand() * Math.PI * 2;
		const phi = Math.acos(starRand() * 0.85 + 0.08);
		starPositions.push(
			280 * Math.sin(phi) * Math.cos(theta),
			280 * Math.cos(phi),
			280 * Math.sin(phi) * Math.sin(theta) - 40,
		);
		starSizes.push(0.6 + starRand() * 1.8);
	}
	const starGeo = track(new BufferGeometry());
	starGeo.setAttribute("position", new Float32BufferAttribute(starPositions, 3));
	starGeo.setAttribute("size", new Float32BufferAttribute(starSizes, 1));
	starGeo.setDrawRange(0, 500);
	const starMat = track(
		new PointsMaterial({
			color: 0xffffff,
			size: 1.6,
			sizeAttenuation: false,
			transparent: true,
			opacity: 0,
			fog: false,
			depthWrite: false,
		}),
	);
	const stars = new Points(starGeo, starMat);
	scene.add(stars);

	// Shooting stars: a small pool of line segments that streak across
	// the sky dome. Each has a random start position, direction, speed,
	// and cooldown timer so they fire sporadically.
	const METEOR_COUNT = 3;
	const meteorPositions = new Float32Array(METEOR_COUNT * 6);
	const meteorGeo = track(new BufferGeometry());
	meteorGeo.setAttribute("position", new Float32BufferAttribute(meteorPositions, 3));
	const meteorMat = track(
		new PointsMaterial({
			color: 0xffffff,
			size: 1.2,
			sizeAttenuation: false,
			transparent: true,
			opacity: 0,
			fog: false,
			depthWrite: false,
			blending: AdditiveBlending,
		}),
	);
	const meteors = new Points(meteorGeo, meteorMat);
	scene.add(meteors);

	const meteorState = Array.from({ length: METEOR_COUNT }, (_, i) => ({
		active: false,
		life: 0,
		maxLife: 0,
		x: 0,
		y: 0,
		z: 0,
		dx: 0,
		dy: 0,
		dz: 0,
		cooldown: 4 + i * 6,
	}));

	return { sky, stars, starMat, starGeo, meteors, meteorMat, meteorGeo, meteorPositions, meteorState };
}

// Sun and moon are distinct bodies on separate arcs. On theme change the
// sun swings down-left out of the scene while the smaller moon rises
// from the right into a higher spot; the waterline clip sells the
// set/rise as they cross y=0.
export function buildCelestial(ctx: SceneCtx, glowTexture: CanvasTexture, sunX: number) {
	const { scene, track, aboveWaterClip } = ctx;

	const makeCelestialGlow = (
		parent: Group,
		color: number,
		opacity: number,
		y: number,
		scale: number,
	) => {
		const material = track(
			new SpriteMaterial({
				map: glowTexture,
				color,
				transparent: true,
				opacity,
				blending: AdditiveBlending,
				fog: false,
				depthWrite: false,
				clippingPlanes: [aboveWaterClip],
			}),
		);
		const sprite = new Sprite(material);
		sprite.scale.setScalar(scale);
		sprite.position.set(0, y, 1);
		sprite.renderOrder = 3;
		parent.add(sprite);
		return { sprite, material };
	};

	const sunPivot = new Group();
	sunPivot.position.set(sunX, 2.5 - SUN_ARC_RADIUS, -190);
	scene.add(sunPivot);
	const sunMat = track(
		new MeshBasicMaterial({ color: DAY.sun, fog: false, clippingPlanes: [aboveWaterClip] }),
	);
	const sun = new Mesh(track(new CircleGeometry(17, 48)), sunMat);
	sun.position.set(0, SUN_ARC_RADIUS, 0);
	sunPivot.add(sun);
	const { sprite: glow, material: glowMat } = makeCelestialGlow(
		sunPivot,
		DAY.sunGlow,
		DAY.glowOpacity,
		SUN_ARC_RADIUS,
		68,
	);

	const moonPhase = REAL_MOON_PHASES ? getMoonPhase() : null;
	const moonIllumination = moonPhase === null ? 1 : getIlluminationFraction(moonPhase);
	const moonTexture = track(makeMoonTexture(moonPhase));
	const moonMat = track(
		new MeshBasicMaterial({
			map: moonTexture,
			// Dim multiplier so the moon glows softly instead of blowing out white.
			color: 0xbcbab0,
			transparent: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const moonPivot = new Group();
	moonPivot.position.set(70, 33 - MOON_ARC_RADIUS, -185);
	scene.add(moonPivot);
	const moon = new Mesh(track(new CircleGeometry(7, 48)), moonMat);
	moon.position.set(0, MOON_ARC_RADIUS, 0);
	moonPivot.add(moon);
	const { material: moonGlowMat } = makeCelestialGlow(
		moonPivot,
		NIGHT.sunGlow,
		0,
		MOON_ARC_RADIUS,
		34,
	);

	return { sunPivot, moonPivot, glow, glowMat, moonGlowMat, moonIllumination };
}
