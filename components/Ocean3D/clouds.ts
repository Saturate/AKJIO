import { Group, IcosahedronGeometry, Mesh, MeshBasicMaterial } from "three";
import { DAY } from "./palette";
import { jitterByPosition } from "./geometry";
import { mulberry32 } from "./random";
import type { SceneCtx } from "./types";

// Fixed pool size; the palette's cloudCount only toggles per-cloud
// visibility, so day/night can show different counts without rebuilding.
export const CLOUD_MAX = 20;
// Drift wrap bound: past this x a cloud teleports to the far side. Wide
// enough that the swap happens outside the frustum at cloud depth.
export const CLOUD_WRAP_X = 170;

export interface CloudState {
	group: Group;
	speed: number;
}

// Low-poly flat clouds: each cloud is a few squashed, jittered icosahedra
// overlapping along x. MeshBasicMaterial (unlit, fogless) keeps them
// reading as painted diorama shapes rather than lit volumes; they hang
// between the islands and the sky dome.
export function buildClouds(ctx: SceneCtx) {
	const { scene, track, aboveWaterClip } = ctx;

	const cloudMat = track(
		new MeshBasicMaterial({
			color: DAY.cloudColor,
			transparent: true,
			opacity: DAY.cloudOpacity,
			fog: false,
			depthWrite: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);

	// Three shared puff variants (20 tris each) so the whole pool stays cheap.
	const puffGeos = [0.22, 0.3, 0.38].map((jitter) => {
		const geo = track(new IcosahedronGeometry(1, 0));
		jitterByPosition(geo, jitter);
		geo.scale(1, 0.45, 0.7);
		return geo;
	});

	const rand = mulberry32(33);
	const cloudsRoot = new Group();
	scene.add(cloudsRoot);

	const clouds: CloudState[] = [];
	for (let i = 0; i < CLOUD_MAX; i++) {
		const group = new Group();
		const puffCount = 3 + Math.floor(rand() * 3);
		for (let p = 0; p < puffCount; p++) {
			const puff = new Mesh(
				puffGeos[Math.floor(rand() * puffGeos.length)],
				cloudMat,
			);
			// Puffs spread along x, largest near the middle, so the cloud
			// silhouette tapers at both ends.
			const spread = p / (puffCount - 1) - 0.5;
			const s = (1 - Math.abs(spread) * 0.8) * (0.75 + rand() * 0.4);
			puff.scale.setScalar(s);
			puff.position.set(
				spread * 2.4 + (rand() - 0.5) * 0.3,
				(rand() - 0.5) * 0.2,
				(rand() - 0.5) * 0.6,
			);
			group.add(puff);
		}
		group.visible = i < DAY.cloudCount;
		cloudsRoot.add(group);
		clouds.push({ group, speed: 0.5 });
	}
	scatterClouds(clouds, rand);

	return { clouds, cloudsRoot, cloudMat };
}

// Re-rolls cloud placement from the caller's seeded rand; used both for the
// initial build and by scatter() on route change.
export function scatterClouds(clouds: CloudState[], rand: () => number) {
	for (const c of clouds) {
		c.group.position.set(
			(rand() - 0.5) * 2 * CLOUD_WRAP_X,
			// Above the island tops (~y 10) but inside the sky band the
			// lens-shifted camera actually shows at cloud depth.
			10 + rand() * 26,
			// Behind the islands (z -75..-120), well in front of the dome (r 300).
			-115 - rand() * 65,
		);
		const s = 2.5 + rand() * 4;
		c.group.scale.set(s, s * 0.65, s);
		c.speed = 0.35 + rand() * 0.75;
	}
}
