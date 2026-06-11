"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { useTheme } from "@/providers/ThemeProvider";
import { getMoonPhase, getIlluminationFraction } from "@/lib/moonPhase";
import styles from "./Ocean3D.module.css";

// Feature flag: render the actual lunar phase instead of a permanent full
// moon. Ported from the feat/real-moon-phases branch of the 2D canvas site.
const REAL_MOON_PHASES = process.env.NEXT_PUBLIC_REAL_MOON_PHASES === "true";

// World layout: the waterline is y=0. The camera sits at a fixed x/z and
// dives from just above the surface down to the seabed as the page scrolls,
// so the header lives in the sky and the footer rests in the rocks.
const CAMERA_Z = 36;
const GLASS_Z = 30;
const CAMERA_TOP_Y = 0.3;
// Initial seabed depth; the real depth is procedural — derived from the
// page's scroll height in applyDepth() so short pages get shallow water
// and long ones a deep ocean, with the footer always ending in the rocks.
const SEABED_Y = -18;
const SEABED_MIN_Y = -7;
const CAMERA_FLOOR_CLEARANCE = 2.5;
const SUN_X = -70;

interface Palette {
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
	beaconIntensity: number;
	glint: number;
}

const DAY: Palette = {
	skyTop: 0x6d7997,
	skyHorizon: 0xdfe3df,
	fog: 0x5ea7d8,
	waterNear: 0x4f9dd6,
	waterFar: 0xa8cbdd,
	glassShallow: 0x5fb0e4,
	glassDeep: 0x123f6b,
	foam: 0xeaf6ff,
	sun: 0xfff3da,
	sunGlow: 0xffe2b0,
	glowOpacity: 0.55,
	rock: 0x97a98f,
	underGeo: 0xbcdcee,
	hemiSky: 0xcfe2ec,
	hemiGround: 0x4a7896,
	hemiIntensity: 1.1,
	dirColor: 0xfff0d8,
	dirIntensity: 1.4,
	starsOpacity: 0,
	beaconIntensity: 2,
	glint: 0.55,
};

const NIGHT: Palette = {
	skyTop: 0x081426,
	skyHorizon: 0x1c3a54,
	fog: 0x0e2638,
	waterNear: 0x1c4470,
	waterFar: 0x1f4060,
	glassShallow: 0x16406a,
	glassDeep: 0x081826,
	foam: 0x9fc4d8,
	sun: 0xf2f4e0,
	sunGlow: 0xbcd4e8,
	glowOpacity: 0.3,
	rock: 0x4e5c52,
	underGeo: 0x3a5e7a,
	hemiSky: 0x3a5e80,
	hemiGround: 0x12243a,
	hemiIntensity: 1.15,
	dirColor: 0xc4d8ec,
	dirIntensity: 0.7,
	starsOpacity: 0.9,
	beaconIntensity: 30,
	glint: 0.3,
};

// FNV-1a: turns the page pathname into a stable scatter seed, so every URL
// gets its own arrangement of stones, fish and seabed — same every visit.
function hashString(str: string): number {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

function mulberry32(seed: number) {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// Position-hashed jitter: duplicated vertices (non-indexed polyhedra) get
// identical offsets, so faces stay welded while the silhouette gets craggy.
function jitterByPosition(geometry: THREE.BufferGeometry, amount: number) {
	const pos = geometry.getAttribute("position");
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i);
		const y = pos.getY(i);
		const z = pos.getZ(i);
		const h = (mx: number, my: number, mz: number) => {
			const s = Math.sin(x * mx + y * my + z * mz) * 43758.5453;
			return (s - Math.floor(s)) - 0.5;
		};
		pos.setXYZ(
			i,
			x + h(127.1, 311.7, 74.7) * amount,
			y + h(269.5, 183.3, 246.1) * amount,
			z + h(113.5, 271.9, 124.6) * amount,
		);
	}
	pos.needsUpdate = true;
}

function makeRock(material: THREE.Material, jitter = 0.35): THREE.Mesh {
	const geometry = new THREE.IcosahedronGeometry(1, 1);
	jitterByPosition(geometry, jitter);
	return new THREE.Mesh(geometry, material);
}

function makeGlowTexture(): THREE.CanvasTexture {
	const size = 256;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		g.addColorStop(0, "rgba(255,255,255,0.9)");
		g.addColorStop(0.3, "rgba(255,255,255,0.35)");
		g.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);
	}
	return new THREE.CanvasTexture(canvas);
}

// Moon with the old site's craters, optionally shaded by the real lunar
// phase (half-circle + ellipse terminator, clipped to the disc).
function makeMoonTexture(phase: number | null): THREE.CanvasTexture {
	const size = 256;
	const c = size / 2;
	const r = size * 0.48;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		ctx.fillStyle = "#f4f1de";
		ctx.beginPath();
		ctx.arc(c, c, r, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = "rgba(168, 165, 146, 0.55)";
		const craters: [number, number, number][] = [
			[-0.25, -0.12, 0.2],
			[0.37, 0.25, 0.15],
			[0.12, -0.37, 0.12],
		];
		for (const [cx, cy, cr] of craters) {
			ctx.beginPath();
			ctx.arc(c + cx * r, c + cy * r, cr * r, 0, Math.PI * 2);
			ctx.fill();
		}

		if (phase !== null && getIlluminationFraction(phase) < 0.99) {
			ctx.save();
			ctx.beginPath();
			ctx.arc(c, c, r, 0, Math.PI * 2);
			ctx.clip();
			const terminatorRx = r * Math.abs(Math.cos(phase * 2 * Math.PI));
			ctx.fillStyle = "rgba(10, 22, 40, 0.85)";
			ctx.beginPath();
			if (phase < 0.5) {
				ctx.arc(c, c, r, Math.PI * 0.5, Math.PI * 1.5);
				ctx.ellipse(c, c, terminatorRx, r, 0, Math.PI * 1.5, Math.PI * 0.5);
			} else {
				ctx.arc(c, c, r, Math.PI * 1.5, Math.PI * 0.5);
				ctx.ellipse(c, c, terminatorRx, r, 0, Math.PI * 0.5, Math.PI * 1.5);
			}
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		}
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

const SKY_VERT = /* glsl */ `
	varying vec3 vWorldPos;
	void main() {
		vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const SKY_FRAG = /* glsl */ `
	uniform vec3 uTop;
	uniform vec3 uHorizon;
	varying vec3 vWorldPos;
	void main() {
		float h = normalize(vWorldPos).y;
		vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.5, h));
		gl_FragColor = vec4(col, 1.0);
	}
`;

const WATER_VERT = /* glsl */ `
	uniform float uTime;
	varying vec3 vPos;
	varying float vWave;
	void main() {
		vec3 p = position;
		float w = sin(p.x * 0.045 + uTime * 0.6) * 0.42
			+ sin(p.x * 0.11 - uTime * 0.42 + p.z * 0.06) * 0.24
			+ sin(p.z * 0.16 + uTime * 0.5 + p.x * 0.02) * 0.2;
		// Only ~9 world units of waterline are visible at the cut plane, so
		// long swells read as a straight line there: they fade out toward the
		// cut while a fine ripple fades in.
		float ripple = sin(p.x * 0.8 + uTime * 0.9) * 0.12
			+ sin(p.x * 0.45 - uTime * 0.55 + p.z * 0.8) * 0.1;
		// Only the top sheet undulates; the wall's deep bottom row (the sole
		// vertices below y=0) stays put. The wall's top row IS the sheet's
		// edge row, so the waterline is welded shut by construction.
		if (p.y > -1.0) {
			p.y += w * smoothstep(30.0, 8.0, p.z) + ripple * smoothstep(8.0, 29.9, p.z);
		}
		vWave = w * 0.7 + ripple;
		vPos = p;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
	}
`;

const WATER_FRAG = /* glsl */ `
	uniform vec3 uNear;
	uniform vec3 uFar;
	uniform vec3 uHorizon;
	uniform vec3 uSunColor;
	uniform vec3 uShallow;
	uniform vec3 uDeep;
	uniform vec3 uFoam;
	uniform float uSunX;
	uniform float uTime;
	uniform float uGlint;
	varying vec3 vPos;
	varying float vWave;
	void main() {
		// Per-facet normals from screen-space derivatives: chunky low-poly
		// shading, and a reliable way to tell the vertical cross-section
		// wall apart from the top sheet.
		vec3 facetNormal = normalize(cross(dFdx(vPos), dFdy(vPos)));

		if (abs(facetNormal.y) < 0.35) {
			// Cross-section wall: the "aquarium glass" front of the block.
			float surf = sin(vPos.x * 0.8 + uTime * 0.9) * 0.12
				+ sin(vPos.x * 0.45 - uTime * 0.55 + 24.0) * 0.1;
			float depth = clamp(-vPos.y / 26.0, 0.0, 1.0);
			vec3 wallCol = mix(uShallow, uDeep, smoothstep(0.0, 1.0, depth));
			float alpha = mix(0.5, 0.68, depth);
			float line = smoothstep(0.25, 0.0, abs(vPos.y - surf));
			wallCol = mix(wallCol, uFoam, line * 0.85);
			alpha = max(alpha, line * 0.95);
			gl_FragColor = vec4(wallCol, alpha);
			return;
		}

		float dist = clamp((36.0 - vPos.z) / 220.0, 0.0, 1.0);
		vec3 col = mix(uNear, uFar, smoothstep(0.0, 0.7, dist));
		col += vWave * 0.06;
		float facetLight = clamp(dot(facetNormal, normalize(vec3(-0.35, 0.9, 0.25))), 0.0, 1.0);
		col *= 0.88 + 0.3 * facetLight;
		// Grazing-angle fresnel, weighted by distance: near water keeps its
		// blue even when the camera sits at the waterline; only the far
		// surface melts into the horizon so there is no hard sky edge.
		vec3 viewDir = normalize(cameraPosition - vPos);
		float grazing = pow(1.0 - clamp(abs(viewDir.y), 0.0, 1.0), 4.0);
		col = mix(col, uHorizon, grazing * (0.2 + 0.6 * smoothstep(0.1, 0.9, dist)));
		float cx = uSunX * dist;
		float streak = exp(-pow(vPos.x - cx, 2.0) / (3.0 + 900.0 * dist * dist));
		float shimmer = 0.6 + 0.4 * sin(vPos.x * 2.4 + vPos.z * 3.1 + uTime * 2.2);
		col += uSunColor * streak * shimmer * uGlint * dist;
		float alpha = 0.94;
		if (!gl_FrontFacing) {
			// Underwater looking up: crossings near the camera stay translucent
			// so the islands read through the surface right at the waterline,
			// while long underwater sightlines go opaque so the above-water
			// world fades out with depth instead of floating in the blue.
			alpha = mix(0.6, 1.0, smoothstep(12.0, 55.0, length(cameraPosition - vPos)));
		}
		gl_FragColor = vec4(col, alpha);
	}
`;

interface SceneApi {
	setDark: (dark: boolean) => void;
	setSeed: (seed: number) => void;
	dispose: () => void;
}

function buildScene(canvas: HTMLCanvasElement, initialDark: boolean): SceneApi | null {
	let renderer: THREE.WebGLRenderer;
	try {
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
	} catch {
		return null;
	}
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;
	renderer.localClippingEnabled = true;

	// Sun and glow exist only above the waterline; underwater you never see
	// the celestial disc, just the light shafts baked into the water shader.
	const aboveWaterClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

	const scene = new THREE.Scene();
	const fog = new THREE.Fog(0x5ea7d8, 12, 150);
	scene.fog = fog;

	const camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		0.1,
		600,
	);
	camera.position.set(0, CAMERA_TOP_Y, CAMERA_Z);
	// Lens-shift the framing downward so the horizon sits at ~36% of the
	// viewport instead of centered: less sky, more ocean, and no camera
	// tilt that would skew the diorama.
	const applyViewOffset = () => {
		const w = window.innerWidth;
		const h = window.innerHeight;
		camera.setViewOffset(w, h, 0, Math.round(h * 0.14), w, h);
	};
	applyViewOffset();

	const disposables: { dispose: () => void }[] = [renderer];
	const track = <T extends { dispose: () => void }>(d: T): T => {
		disposables.push(d);
		return d;
	};

	// Uniform color instances are kept as direct references so the palette
	// lerp can mutate them without casting back out of the uniforms object.
	const skyTopColor = new THREE.Color(DAY.skyTop);
	const skyHorizonColor = new THREE.Color(DAY.skyHorizon);
	const waterNearColor = new THREE.Color(DAY.waterNear);
	const waterFarColor = new THREE.Color(DAY.waterFar);
	const waterHorizonColor = new THREE.Color(DAY.skyHorizon);
	const waterSunColor = new THREE.Color(DAY.sun);
	const glassShallowColor = new THREE.Color(DAY.glassShallow);
	const glassDeepColor = new THREE.Color(DAY.glassDeep);
	const glassFoamColor = new THREE.Color(DAY.foam);

	// --- Sky ---------------------------------------------------------------
	const skyMat = track(
		new THREE.ShaderMaterial({
			uniforms: {
				uTop: { value: skyTopColor },
				uHorizon: { value: skyHorizonColor },
			},
			vertexShader: SKY_VERT,
			fragmentShader: SKY_FRAG,
			side: THREE.BackSide,
			fog: false,
			depthWrite: false,
		}),
	);
	const sky = new THREE.Mesh(track(new THREE.SphereGeometry(300, 24, 12)), skyMat);
	scene.add(sky);

	const starRand = mulberry32(7);
	const starPositions: number[] = [];
	for (let i = 0; i < 220; i++) {
		const theta = starRand() * Math.PI * 2;
		const phi = Math.acos(starRand() * 0.85 + 0.08);
		starPositions.push(
			280 * Math.sin(phi) * Math.cos(theta),
			280 * Math.cos(phi),
			280 * Math.sin(phi) * Math.sin(theta) - 40,
		);
	}
	const starGeo = track(new THREE.BufferGeometry());
	starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
	const starMat = track(
		new THREE.PointsMaterial({
			color: 0xffffff,
			size: 1.6,
			sizeAttenuation: false,
			transparent: true,
			opacity: 0,
			fog: false,
			depthWrite: false,
		}),
	);
	const stars = new THREE.Points(starGeo, starMat);
	scene.add(stars);

	// --- Sun / moon ----------------------------------------------------------
	// Sun and moon are distinct bodies on separate arcs. On theme change the
	// sun swings down-left out of the scene while the smaller moon rises
	// from the right into a higher spot; the waterline clip sells the
	// set/rise as they cross y=0.
	const SUN_ARC_RADIUS = 30;
	const MOON_ARC_RADIUS = 26;
	const SET_ANGLE = 0.7 * Math.PI;

	const glowTexture = track(makeGlowTexture());
	const makeCelestialGlow = (parent: THREE.Group, color: number, opacity: number, y: number, scale: number) => {
		const material = track(
			new THREE.SpriteMaterial({
				map: glowTexture,
				color,
				transparent: true,
				opacity,
				blending: THREE.AdditiveBlending,
				fog: false,
				depthWrite: false,
				clippingPlanes: [aboveWaterClip],
			}),
		);
		const sprite = new THREE.Sprite(material);
		sprite.scale.setScalar(scale);
		sprite.position.set(0, y, 1);
		sprite.renderOrder = 3;
		parent.add(sprite);
		return { sprite, material };
	};

	const sunPivot = new THREE.Group();
	sunPivot.position.set(SUN_X, 2.5 - SUN_ARC_RADIUS, -190);
	scene.add(sunPivot);
	const sunMat = track(
		new THREE.MeshBasicMaterial({ color: DAY.sun, fog: false, clippingPlanes: [aboveWaterClip] }),
	);
	const sun = new THREE.Mesh(track(new THREE.CircleGeometry(17, 48)), sunMat);
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
		new THREE.MeshBasicMaterial({
			map: moonTexture,
			// Dim multiplier so the moon glows softly instead of blowing out white.
			color: 0xbcbab0,
			transparent: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const moonPivot = new THREE.Group();
	moonPivot.position.set(70, 33 - MOON_ARC_RADIUS, -185);
	scene.add(moonPivot);
	const moon = new THREE.Mesh(track(new THREE.CircleGeometry(7, 48)), moonMat);
	moon.position.set(0, MOON_ARC_RADIUS, 0);
	moonPivot.add(moon);
	const { material: moonGlowMat } = makeCelestialGlow(
		moonPivot,
		NIGHT.sunGlow,
		0,
		MOON_ARC_RADIUS,
		34,
	);

	// --- Lights ------------------------------------------------------------
	const hemi = new THREE.HemisphereLight(DAY.hemiSky, DAY.hemiGround, DAY.hemiIntensity);
	scene.add(hemi);
	const dir = new THREE.DirectionalLight(DAY.dirColor, DAY.dirIntensity);
	dir.position.set(-50, 25, -60);
	scene.add(dir);

	// --- Islands -----------------------------------------------------------
	// Icebergs, not cutouts: the rock continues below the waterline, and its
	// submerged part fades into the water color with depth so it reads as a
	// pale floating-island silhouette instead of a dark unfogged blob.
	const rockMat = track(
		new THREE.MeshStandardMaterial({ color: DAY.rock, flatShading: true, fog: false }),
	);
	rockMat.onBeforeCompile = (shader) => {
		shader.uniforms.uWaterTint = { value: glassShallowColor };
		shader.vertexShader = shader.vertexShader.replace(
			"#include <fog_vertex>",
			"#include <fog_vertex>\n\tvOceanWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;",
		);
		shader.vertexShader = `varying vec3 vOceanWorldPos;\n${shader.vertexShader}`;
		shader.fragmentShader = `varying vec3 vOceanWorldPos;\nuniform vec3 uWaterTint;\n${shader.fragmentShader}`;
		shader.fragmentShader = shader.fragmentShader.replace(
			"#include <dithering_fragment>",
			"#include <dithering_fragment>\n\tfloat oceanUnder = smoothstep(0.0, -7.0, vOceanWorldPos.y);\n\tgl_FragColor.rgb = mix(gl_FragColor.rgb, uWaterTint, oceanUnder * 0.85);",
		);
	};

	const leftIsland = makeRock(rockMat);
	leftIsland.scale.set(17, 10, 12);
	leftIsland.position.set(-55, -2, -120);
	leftIsland.rotation.y = 0.7;
	scene.add(leftIsland);

	const leftIslandSmall = makeRock(rockMat, 0.5);
	leftIslandSmall.scale.set(8, 5, 7);
	leftIslandSmall.position.set(-42, -1.5, -112);
	leftIslandSmall.rotation.y = 2.1;
	scene.add(leftIslandSmall);

	const lighthouseIsland = makeRock(rockMat);
	lighthouseIsland.scale.set(10, 7.5, 8);
	lighthouseIsland.position.set(15, -1.5, -75);
	lighthouseIsland.rotation.y = 1.3;
	scene.add(lighthouseIsland);

	const lighthouseIslandSmall = makeRock(rockMat, 0.5);
	lighthouseIslandSmall.scale.set(5, 3.5, 5);
	lighthouseIslandSmall.position.set(24, -0.8, -71);
	lighthouseIslandSmall.rotation.y = 4.2;
	scene.add(lighthouseIslandSmall);

	// --- Lighthouse ----------------------------------------------------------
	const whiteMat = track(
		new THREE.MeshStandardMaterial({
			color: 0xf2efe6,
			flatShading: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const redMat = track(
		new THREE.MeshStandardMaterial({
			color: 0xc8372a,
			flatShading: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const darkMat = track(
		new THREE.MeshStandardMaterial({
			color: 0x22262c,
			flatShading: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const lampMat = track(
		new THREE.MeshBasicMaterial({ color: 0xfff2dc, fog: false, clippingPlanes: [aboveWaterClip] }),
	);

	const lighthouse = new THREE.Group();
	const bandHeights = [1.1, 1.0, 0.9, 0.85, 0.8];
	let towerY = 0;
	bandHeights.forEach((h, i) => {
		const rBottom = 0.66 - i * 0.05;
		const rTop = 0.66 - (i + 1) * 0.05;
		const band = new THREE.Mesh(
			track(new THREE.CylinderGeometry(rTop, rBottom, h, 12)),
			i % 2 === 1 ? redMat : whiteMat,
		);
		band.position.y = towerY + h / 2;
		towerY += h;
		lighthouse.add(band);
	});
	const gallery = new THREE.Mesh(track(new THREE.CylinderGeometry(0.52, 0.52, 0.18, 12)), darkMat);
	gallery.position.y = towerY + 0.09;
	lighthouse.add(gallery);
	const lamp = new THREE.Mesh(track(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 10)), lampMat);
	lamp.position.y = towerY + 0.45;
	lighthouse.add(lamp);
	const roof = new THREE.Mesh(track(new THREE.ConeGeometry(0.42, 0.55, 10)), redMat);
	roof.position.y = towerY + 0.95;
	lighthouse.add(roof);
	const beacon = new THREE.PointLight(0xff6a4a, DAY.beaconIntensity, 60, 1.6);
	beacon.position.y = towerY + 0.45;
	lighthouse.add(beacon);
	const lampGlowMat = track(
		new THREE.SpriteMaterial({
			map: glowTexture,
			color: 0xffd9a0,
			transparent: true,
			opacity: 0.25,
			blending: THREE.AdditiveBlending,
			fog: false,
			depthWrite: false,
		}),
	);
	const lampGlow = new THREE.Sprite(lampGlowMat);
	lampGlow.scale.setScalar(3.5);
	lampGlow.position.y = towerY + 0.45;
	lampGlow.renderOrder = 3;
	lighthouse.add(lampGlow);
	lighthouse.position.set(12, 4.6, -72);
	scene.add(lighthouse);

	// --- Ship + rowboat -------------------------------------------------------
	const orangeMat = track(
		new THREE.MeshStandardMaterial({
			color: 0xe8622d,
			flatShading: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const ship = new THREE.Group();
	const hull = new THREE.Mesh(track(new THREE.BoxGeometry(8, 1.6, 2.2)), darkMat);
	hull.position.y = 0.5;
	ship.add(hull);
	const cabin1 = new THREE.Mesh(track(new THREE.BoxGeometry(1.6, 1.3, 1.5)), whiteMat);
	cabin1.position.set(-1.6, 1.9, 0);
	ship.add(cabin1);
	const cabin2 = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 0.9, 1.2)), whiteMat);
	cabin2.position.set(0.2, 1.7, 0);
	ship.add(cabin2);
	const funnel = new THREE.Mesh(track(new THREE.ConeGeometry(0.45, 1.6, 8)), orangeMat);
	funnel.position.set(1.8, 2.3, 0);
	ship.add(funnel);
	const mast = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6)), darkMat);
	mast.position.set(3.1, 2.4, 0);
	ship.add(mast);
	ship.position.set(27, -0.1, -78);
	scene.add(ship);

	// --- Water block ------------------------------------------------------------
	// One welded mesh, like a low-poly water cube: the wavy top sheet spans
	// z -190..30 and its front edge row doubles as the top of the vertical
	// cross-section wall (one extra vertex row dropped to y=-400 at z=30).
	// Shared edge vertices mean the waterline can never gap open.
	const X_SEGS = 220;
	const Z_SEGS = 40;
	const waterCols = X_SEGS + 1;
	const waterPositions: number[] = [];
	for (let r = 0; r <= Z_SEGS; r++) {
		const z = -190 + (220 * r) / Z_SEGS;
		for (let c = 0; c <= X_SEGS; c++) {
			waterPositions.push(-260 + (520 * c) / X_SEGS, 0, z);
		}
	}
	for (let c = 0; c <= X_SEGS; c++) {
		waterPositions.push(-260 + (520 * c) / X_SEGS, -400, 30);
	}
	const waterIndices: number[] = [];
	for (let r = 0; r < Z_SEGS; r++) {
		for (let c = 0; c < X_SEGS; c++) {
			const a = r * waterCols + c;
			waterIndices.push(a, a + waterCols, a + 1, a + 1, a + waterCols, a + waterCols + 1);
		}
	}
	const wallRowStart = (Z_SEGS + 1) * waterCols;
	const topEdgeStart = Z_SEGS * waterCols;
	for (let c = 0; c < X_SEGS; c++) {
		const a = topEdgeStart + c;
		const d = wallRowStart + c;
		waterIndices.push(a, d, a + 1, a + 1, d, d + 1);
	}
	const waterGeo = track(new THREE.BufferGeometry());
	waterGeo.setIndex(waterIndices);
	waterGeo.setAttribute("position", new THREE.Float32BufferAttribute(waterPositions, 3));
	const waterMat = track(
		new THREE.ShaderMaterial({
			uniforms: {
				uTime: { value: 0 },
				uNear: { value: waterNearColor },
				uFar: { value: waterFarColor },
				uHorizon: { value: waterHorizonColor },
				uSunColor: { value: waterSunColor },
				uShallow: { value: glassShallowColor },
				uDeep: { value: glassDeepColor },
				uFoam: { value: glassFoamColor },
				uSunX: { value: SUN_X },
				uGlint: { value: DAY.glint },
			},
			vertexShader: WATER_VERT,
			fragmentShader: WATER_FRAG,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			fog: false,
		}),
	);
	const water = new THREE.Mesh(waterGeo, waterMat);
	// Renders after the underwater world so the cross-section wall tints it.
	water.renderOrder = 10;
	scene.add(water);

	// --- Underwater world --------------------------------------------------------
	const underMat = track(
		new THREE.MeshStandardMaterial({ color: DAY.underGeo, flatShading: true }),
	);

	const seabedGeo = track(new THREE.PlaneGeometry(320, 180, 90, 50));
	seabedGeo.rotateX(-Math.PI / 2);
	// Ridges are generated in scatter(), seeded per URL.
	const seabed = new THREE.Mesh(seabedGeo, underMat);
	seabed.position.set(0, SEABED_Y, -64); // span z from -154 to +26
	scene.add(seabed);

	// Island roots: the above-water rocks continue down as huge pale cliffs.
	const rootRand = mulberry32(21);
	// Only directly beneath the two islands: free-standing columns read as
	// boulders floating mid-water once the procedural depth stretches them.
	const rootSpecs: [number, number, number, number, number][] = [
		// x, z, sx, sy, sz
		[16, -77, 11, 20, 9],
		[-52, -118, 18, 16, 13],
	];
	const roots: THREE.Mesh[] = [];
	for (const [x, z, sx, sy, sz] of rootSpecs) {
		const root = makeRock(underMat, 0.45);
		root.scale.set(sx, sy, sz);
		// Jitter pushes vertices up to ~1.25x the unit radius, so this keeps
		// every cliff top just below the waterline instead of poking out.
		root.position.set(x, -1.25 * sy - 0.5, z);
		root.rotation.y = rootRand() * Math.PI * 2;
		roots.push(root);
		scene.add(root);
	}

	// Near-field seabed rocks, visible behind the footer at full depth. Kept
	// within ~20 units of the camera plane: distant rocks on a deep seabed
	// project near eye level with the ground fogged out beneath them, which
	// reads as stones floating in open water.
	const seabedRocks: THREE.Mesh[] = [];
	for (let i = 0; i < 12; i++) {
		const rock = makeRock(underMat, 0.5);
		const s = 1 + rootRand() * 3.5;
		rock.scale.set(s * (1 + rootRand()), s * 0.8, s);
		rock.position.set(
			(rootRand() - 0.5) * 56,
			SEABED_Y + 0.4,
			26 - rootRand() * 18,
		);
		rock.rotation.y = rootRand() * Math.PI * 2;
		seabedRocks.push(rock);
		scene.add(rock);
	}

	// Foreground seabed cross-section: a bumpy low-poly rock wall that fills
	// the bottom of the frame at full depth, so the dive ends "in the rocks"
	// behind the footer instead of clipping into open void.
	const wallGeo = track(new THREE.PlaneGeometry(80, 44, 64, 18));
	jitterByPosition(wallGeo, 1.8);
	const wall = new THREE.Mesh(wallGeo, underMat);
	wall.position.set(0, -39.2, 28);
	scene.add(wall);

	const wreck = new THREE.Group();
	const wreckHull = new THREE.Mesh(track(new THREE.BoxGeometry(4.2, 1.2, 1.5)), underMat);
	wreck.add(wreckHull);
	const wreckBow = new THREE.Mesh(track(new THREE.ConeGeometry(0.8, 1.6, 4)), underMat);
	wreckBow.rotation.z = -Math.PI / 2;
	wreckBow.position.x = 2.8;
	wreck.add(wreckBow);
	const wreckMast = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 6)), underMat);
	wreckMast.rotation.z = 0.5;
	wreckMast.position.set(-0.6, 1.4, 0);
	wreck.add(wreckMast);
	wreck.position.set(-7, SEABED_Y + 1.1, 4);
	wreck.rotation.set(0.12, 0.6, 0.28);
	scene.add(wreck);

	// --- Fish + bubbles --------------------------------------------------------
	// Low-poly fish facing +x: diamond body from two squashed cones, a
	// dorsal fin, and a tail pivoted at its tip so it can wag.
	const fishHeadGeo = track(new THREE.ConeGeometry(0.26, 0.5, 6));
	fishHeadGeo.rotateZ(-Math.PI / 2);
	fishHeadGeo.scale(1, 1, 0.55);
	fishHeadGeo.translate(0.25, 0, 0);
	const fishBodyGeo = track(new THREE.ConeGeometry(0.26, 0.7, 6));
	fishBodyGeo.rotateZ(Math.PI / 2);
	fishBodyGeo.scale(1, 1, 0.55);
	fishBodyGeo.translate(-0.35, 0, 0);
	const fishTailGeo = track(new THREE.ConeGeometry(0.3, 0.45, 4));
	fishTailGeo.rotateZ(-Math.PI / 2);
	fishTailGeo.scale(1, 1, 0.18);
	fishTailGeo.translate(-0.225, 0, 0);
	const fishFinGeo = track(new THREE.ConeGeometry(0.16, 0.28, 4));
	fishFinGeo.scale(1, 1, 0.2);
	fishFinGeo.translate(-0.05, 0.3, 0);

	const fishRand = mulberry32(99);
	const fish: {
		mesh: THREE.Group;
		tail: THREE.Mesh;
		speed: number;
		phase: number;
		baseY: number;
		depthFrac: number;
	}[] = [];
	for (let i = 0; i < 7; i++) {
		const f = new THREE.Group();
		const tail = new THREE.Mesh(fishTailGeo, underMat);
		tail.position.x = -0.62;
		f.add(
			new THREE.Mesh(fishHeadGeo, underMat),
			new THREE.Mesh(fishBodyGeo, underMat),
			new THREE.Mesh(fishFinGeo, underMat),
			tail,
		);
		const speed = (0.8 + fishRand() * 1.6) * (fishRand() > 0.5 ? 1 : -1);
		const depthFrac = fishRand();
		f.position.set((fishRand() - 0.5) * 50, -3, 10 - fishRand() * 40);
		f.scale.setScalar(0.8 + fishRand() * 1.4);
		if (speed < 0) f.rotation.y = Math.PI;
		fish.push({ mesh: f, tail, speed, phase: fishRand() * Math.PI * 2, baseY: -3, depthFrac });
		scene.add(f);
	}

	const bubbleRand = mulberry32(5);
	const bubbleCount = 50;
	const bubblePositions = new Float32Array(bubbleCount * 3);
	const bubbleDepthFracs = new Float32Array(bubbleCount);
	for (let i = 0; i < bubbleCount; i++) {
		bubbleDepthFracs[i] = bubbleRand();
		bubblePositions[i * 3] = (bubbleRand() - 0.5) * 50;
		bubblePositions[i * 3 + 1] = -bubbleDepthFracs[i] * 17;
		bubblePositions[i * 3 + 2] = 22 - bubbleRand() * 45;
	}
	const bubbleGeo = track(new THREE.BufferGeometry());
	bubbleGeo.setAttribute("position", new THREE.BufferAttribute(bubblePositions, 3));
	const bubbleMat = track(
		new THREE.PointsMaterial({
			color: 0xdff2ff,
			size: 0.16,
			transparent: true,
			opacity: 0.35,
			depthWrite: false,
		}),
	);
	scene.add(new THREE.Points(bubbleGeo, bubbleMat));

	// --- Palette / theme -----------------------------------------------------
	let mix = initialDark ? 1 : 0;
	let mixTarget = mix;
	const colorA = new THREE.Color();
	const colorB = new THREE.Color();
	const lerpColor = (target: THREE.Color, day: number, night: number, m: number) => {
		colorA.setHex(day);
		colorB.setHex(night);
		target.copy(colorA).lerp(colorB, m);
	};

	function applyPalette(m: number) {
		lerpColor(skyTopColor, DAY.skyTop, NIGHT.skyTop, m);
		lerpColor(skyHorizonColor, DAY.skyHorizon, NIGHT.skyHorizon, m);
		lerpColor(fog.color, DAY.fog, NIGHT.fog, m);
		lerpColor(waterNearColor, DAY.waterNear, NIGHT.waterNear, m);
		lerpColor(waterFarColor, DAY.waterFar, NIGHT.waterFar, m);
		lerpColor(waterHorizonColor, DAY.skyHorizon, NIGHT.skyHorizon, m);
		lerpColor(waterSunColor, DAY.sun, NIGHT.sun, m);
		waterMat.uniforms.uGlint.value = DAY.glint + (NIGHT.glint - DAY.glint) * m;
		lerpColor(glassShallowColor, DAY.glassShallow, NIGHT.glassShallow, m);
		lerpColor(glassDeepColor, DAY.glassDeep, NIGHT.glassDeep, m);
		lerpColor(glassFoamColor, DAY.foam, NIGHT.foam, m);
		// Sun arcs down and out to the left; the moon rises in from the right.
		sunPivot.rotation.z = m * SET_ANGLE;
		moonPivot.rotation.z = -(1 - m) * SET_ANGLE;
		glowMat.opacity = DAY.glowOpacity * (1 - m);
		moonGlowMat.opacity = 0.55 * m * (0.4 + 0.6 * moonIllumination);
		lerpColor(rockMat.color, DAY.rock, NIGHT.rock, m);
		lerpColor(underMat.color, DAY.underGeo, NIGHT.underGeo, m);
		lerpColor(hemi.color, DAY.hemiSky, NIGHT.hemiSky, m);
		lerpColor(hemi.groundColor, DAY.hemiGround, NIGHT.hemiGround, m);
		hemi.intensity = DAY.hemiIntensity + (NIGHT.hemiIntensity - DAY.hemiIntensity) * m;
		lerpColor(dir.color, DAY.dirColor, NIGHT.dirColor, m);
		dir.intensity = DAY.dirIntensity + (NIGHT.dirIntensity - DAY.dirIntensity) * m;
		starMat.opacity = DAY.starsOpacity + (NIGHT.starsOpacity - DAY.starsOpacity) * m;
		beacon.intensity = DAY.beaconIntensity + (NIGHT.beaconIntensity - DAY.beaconIntensity) * m;
		lampGlowMat.opacity = 0.25 + 0.6 * m;
	}
	applyPalette(mix);

	// --- Per-URL scatter ---------------------------------------------------
	// Everything loose underwater re-rolls from the page's pathname hash:
	// the same article always shows the same ocean, but every page differs.
	function scatter(seed: number) {
		const rand = mulberry32(seed);

		const seabedPos = seabedGeo.getAttribute("position");
		const ox = rand() * 100;
		const oz = rand() * 100;
		for (let i = 0; i < seabedPos.count; i++) {
			const x = seabedPos.getX(i);
			const z = seabedPos.getZ(i);
			const ridges =
				Math.sin(x * 0.12 + ox) * Math.cos(z * 0.1 + oz) * 1.4 +
				Math.sin(x * 0.31 + z * 0.21 + ox) * 0.6 +
				Math.sin(z * 0.45 - x * 0.07 + oz) * 0.35;
			seabedPos.setY(i, ridges);
		}
		seabedPos.needsUpdate = true;
		seabedGeo.computeVertexNormals();

		for (const rock of seabedRocks) {
			const s = 1 + rand() * 3.5;
			rock.scale.set(s * (1 + rand()), s * 0.8, s);
			rock.position.x = (rand() - 0.5) * 56;
			rock.position.z = 26 - rand() * 18;
			rock.rotation.y = rand() * Math.PI * 2;
		}

		wreck.position.x = -16 + rand() * 28;
		wreck.rotation.y = rand() * Math.PI * 2;

		for (const f of fish) {
			f.speed = (0.8 + rand() * 1.6) * (rand() > 0.5 ? 1 : -1);
			f.phase = rand() * Math.PI * 2;
			f.depthFrac = rand();
			f.mesh.position.x = (rand() - 0.5) * 50;
			f.mesh.position.z = 10 - rand() * 40;
			f.mesh.scale.setScalar(0.8 + rand() * 1.4);
			f.mesh.rotation.y = f.speed < 0 ? Math.PI : 0;
		}

		const bp = bubbleGeo.getAttribute("position");
		for (let i = 0; i < bubbleCount; i++) {
			bubbleDepthFracs[i] = rand();
			bp.setX(i, (rand() - 0.5) * 50);
			bp.setZ(i, 22 - rand() * 18);
		}
		bp.needsUpdate = true;

		applyDepth();
	}

	// --- Procedural depth ------------------------------------------------------
	// The ocean floor is generated from the page height: the camera descends
	// 1:1 with the content (one viewport of scroll = one frame-height), and
	// the seabed sits exactly where the footer lands. Short page, shallow
	// lagoon; long article, deep ocean.
	let seabedY = SEABED_Y;
	let cameraFloorY = SEABED_Y + CAMERA_FLOOR_CLEARANCE;

	function worldPerPixel(): number {
		const frustumHeight =
			2 * (CAMERA_Z - GLASS_Z) * Math.tan((camera.fov * Math.PI) / 360);
		return frustumHeight / window.innerHeight;
	}

	function applyDepth() {
		const scrollMax = Math.max(
			0,
			document.documentElement.scrollHeight - window.innerHeight,
		);
		seabedY = Math.min(
			SEABED_MIN_Y,
			CAMERA_TOP_Y - scrollMax * worldPerPixel() - CAMERA_FLOOR_CLEARANCE,
		);
		cameraFloorY = seabedY + CAMERA_FLOOR_CLEARANCE;

		seabed.position.y = seabedY;
		wall.position.y = seabedY - 21.2; // ridge crest ends up just above the floor
		wreck.position.y = seabedY + 1.1;
		for (const rock of seabedRocks) rock.position.y = seabedY + 0.4;
		// Stretch the island roots so the cliffs always run surface-to-floor.
		for (const root of roots) {
			const sy = Math.max(3, (-seabedY - 0.8) / 2.2);
			root.scale.y = sy;
			root.position.y = -0.8 - 1.25 * sy;
		}
		for (const f of fish) {
			f.baseY = -2.5 + (seabedY + 4 - -2.5) * f.depthFrac;
		}
		const bp = bubbleGeo.getAttribute("position");
		for (let i = 0; i < bubbleCount; i++) {
			bp.setY(i, (seabedY + 1) * bubbleDepthFracs[i]);
		}
		bp.needsUpdate = true;
	}

	// --- Scroll / mouse / loop -------------------------------------------------
	let scrollTarget = 0;
	let scrollCurrent = 0;
	let mouseX = 0;
	let mouseCurrent = 0;

	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	function readScroll() {
		scrollTarget = window.scrollY;
	}

	const onScroll = () => readScroll();
	const onMouseMove = (e: MouseEvent) => {
		mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
	};
	const onResize = () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		applyViewOffset();
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		readScroll();
		applyDepth();
		if (reducedMotion) renderFrame(0.016);
	};
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", onResize);
	if (!reducedMotion) window.addEventListener("mousemove", onMouseMove, { passive: true });
	readScroll();
	scatter(hashString(window.location.pathname));

	// Content height changes on route navigation and lazy-loaded media; the
	// ocean re-derives its depth whenever the page grows or shrinks.
	const contentObserver = new ResizeObserver(() => {
		applyDepth();
		readScroll();
		if (reducedMotion) renderFrame(0.016);
	});
	contentObserver.observe(document.body);

	let lastTime = performance.now();
	let elapsed = 0;
	let rafId = 0;

	function renderFrame(dt: number) {
		elapsed += dt;
		const t = elapsed;

		if (Math.abs(mixTarget - mix) > 0.0005) {
			mix += (mixTarget - mix) * Math.min(1, dt * 3.5);
			if (Math.abs(mixTarget - mix) <= 0.0005) mix = mixTarget;
			applyPalette(mix);
		}

		// No easing on scroll: the camera tracks the page exactly, so the
		// scene and content move at the same speed with the same smoothness.
		scrollCurrent = scrollTarget;
		mouseCurrent += (mouseX - mouseCurrent) * Math.min(1, dt * 3);

		// Sky bodies don't write depth against the transparent water surface,
		// so they'd shine through it from below — hide them once the camera
		// is underwater (the waterline is off-screen by then, no visible pop).
		const skyVisible = camera.position.y > -1.5;
		sunPivot.visible = skyVisible;
		moonPivot.visible = skyVisible;
		stars.visible = skyVisible;

		// Camera and content move 1:1 — one viewport of scroll equals one
		// frame-height of descent, so the scene feels attached to the page.
		camera.position.y = Math.max(cameraFloorY, CAMERA_TOP_Y - scrollCurrent * worldPerPixel());
		camera.position.x = mouseCurrent * 0.5;
		camera.rotation.set(0, -mouseCurrent * 0.01, 0);

		waterMat.uniforms.uTime.value = t;

		const bob = Math.sin(t * 0.8) * 0.12;
		ship.position.y = -0.1 + bob;
		ship.rotation.z = Math.sin(t * 0.6) * 0.02;

		beacon.intensity =
			(DAY.beaconIntensity + (NIGHT.beaconIntensity - DAY.beaconIntensity) * mix) *
			(0.7 + 0.3 * Math.sin(t * 2.4));
		glow.scale.setScalar(68 + Math.sin(t * 0.5) * 3);

		for (const f of fish) {
			f.mesh.position.x += f.speed * dt;
			f.mesh.position.y = f.baseY + Math.sin(t * 1.4 + f.phase) * 0.3;
			// Tail wag speed follows swim speed; slight body roll sells the motion.
			f.tail.rotation.y = Math.sin(t * (4 + Math.abs(f.speed) * 2) + f.phase) * 0.5;
			f.mesh.rotation.z = Math.sin(t * 1.4 + f.phase) * 0.07;
			if (f.mesh.position.x > 32) f.mesh.position.x = -32;
			if (f.mesh.position.x < -32) f.mesh.position.x = 32;
		}
		const bp = bubbleGeo.getAttribute("position");
		for (let i = 0; i < bubbleCount; i++) {
			let y = bp.getY(i) + dt * (0.4 + (i % 5) * 0.12);
			if (y > -0.3) y = seabedY + 1;
			bp.setY(i, y);
			bp.setX(i, bp.getX(i) + Math.sin(t + i) * dt * 0.08);
		}
		bp.needsUpdate = true;

		renderer.render(scene, camera);
	}

	function loop() {
		const now = performance.now();
		const dt = Math.min(0.05, (now - lastTime) / 1000);
		lastTime = now;
		renderFrame(dt);
		rafId = requestAnimationFrame(loop);
	}

	const onReducedScroll = () => renderFrame(0.016);
	if (reducedMotion) {
		// Static diorama: render on demand instead of a continuous loop.
		renderFrame(0.016);
		window.addEventListener("scroll", onReducedScroll, { passive: true });
	} else {
		rafId = requestAnimationFrame(loop);
	}

	return {
		setDark: (dark: boolean) => {
			mixTarget = dark ? 1 : 0;
			if (reducedMotion) {
				mix = mixTarget;
				applyPalette(mix);
				renderFrame(0.016);
			}
		},
		setSeed: (seed: number) => {
			scatter(seed);
			if (reducedMotion) renderFrame(0.016);
		},
		dispose: () => {
			cancelAnimationFrame(rafId);
			contentObserver.disconnect();
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("scroll", onReducedScroll);
			window.removeEventListener("resize", onResize);
			window.removeEventListener("mousemove", onMouseMove);
			scene.traverse((obj) => {
				if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
					obj.geometry.dispose();
				}
			});
			for (const d of disposables) d.dispose();
		},
	};
}

export default function Ocean3D() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const apiRef = useRef<SceneApi | null>(null);
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		// The inline head script has already put the resolved class on <html>,
		// so this is theme-correct before React state settles.
		const initialDark = document.documentElement.classList.contains("dark");
		const api = buildScene(canvas, initialDark);
		apiRef.current = api;
		return () => {
			api?.dispose();
			apiRef.current = null;
		};
	}, []);

	useEffect(() => {
		apiRef.current?.setDark(resolvedTheme === "dark");
	}, [resolvedTheme]);

	const pathname = usePathname();
	useEffect(() => {
		apiRef.current?.setSeed(hashString(pathname));
	}, [pathname]);

	return <canvas ref={canvasRef} className={styles.oceanCanvas} aria-hidden="true" />;
}
