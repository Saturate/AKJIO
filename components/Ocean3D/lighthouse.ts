import {
	AdditiveBlending,
	CanvasTexture,
	ConeGeometry,
	CylinderGeometry,
	DoubleSide,
	Group,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	PointLight,
	SpotLight,
	Sprite,
	SpriteMaterial,
} from "three";
import { DAY } from "./palette";
import type { SceneCtx } from "./types";

// Striped tower on the island, with a warm beacon point light, a lamp glow
// sprite, and the rotating bi-directional beam. whiteMat/darkMat are shared
// with the ship builder, so they ride along in the return value.
export function buildLighthouse(ctx: SceneCtx, glowTexture: CanvasTexture) {
	const { scene, track, aboveWaterClip } = ctx;
	const whiteMat = track(
		new MeshStandardMaterial({
			color: 0xf2efe6,
			flatShading: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const redMat = track(
		new MeshStandardMaterial({
			color: 0xc8372a,
			flatShading: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const darkMat = track(
		new MeshStandardMaterial({
			color: 0x22262c,
			flatShading: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const lampMat = track(
		new MeshBasicMaterial({ color: 0xfff2dc, fog: false, clippingPlanes: [aboveWaterClip] }),
	);

	const lighthouse = new Group();
	const bandHeights = [1.1, 1.0, 0.9, 0.85, 0.8];
	let towerY = 0;
	bandHeights.forEach((h, i) => {
		const rBottom = 0.66 - i * 0.05;
		const rTop = 0.66 - (i + 1) * 0.05;
		const band = new Mesh(
			track(new CylinderGeometry(rTop, rBottom, h, 12)),
			i % 2 === 1 ? redMat : whiteMat,
		);
		band.position.y = towerY + h / 2;
		towerY += h;
		lighthouse.add(band);
	});
	const gallery = new Mesh(track(new CylinderGeometry(0.52, 0.52, 0.18, 12)), darkMat);
	gallery.position.y = towerY + 0.09;
	lighthouse.add(gallery);
	const lamp = new Mesh(track(new CylinderGeometry(0.3, 0.3, 0.5, 10)), lampMat);
	lamp.position.y = towerY + 0.45;
	lighthouse.add(lamp);
	const roof = new Mesh(track(new ConeGeometry(0.42, 0.55, 10)), redMat);
	roof.position.y = towerY + 0.95;
	lighthouse.add(roof);
	const beacon = new PointLight(0xff6a4a, DAY.beaconIntensity, 60, 1.6);
	beacon.position.y = towerY + 0.45;
	lighthouse.add(beacon);
	const lampGlowMat = track(
		new SpriteMaterial({
			map: glowTexture,
			color: 0xffd9a0,
			transparent: true,
			opacity: 0.25,
			blending: AdditiveBlending,
			fog: false,
			depthWrite: false,
		}),
	);
	const lampGlow = new Sprite(lampGlowMat);
	lampGlow.scale.setScalar(3.5);
	lampGlow.position.y = towerY + 0.45;
	lampGlow.renderOrder = 3;
	lighthouse.add(lampGlow);

	// Rotating beam: two opposed light cones sweeping from the lamp room,
	// visible at night only (opacity follows the palette mix). An alpha
	// gradient along the cone fades it out instead of ending abruptly.
	const beamCanvas = document.createElement("canvas");
	beamCanvas.width = 4;
	beamCanvas.height = 128;
	const beamCtx = beamCanvas.getContext("2d");
	if (beamCtx) {
		const g = beamCtx.createLinearGradient(0, 0, 0, 128);
		g.addColorStop(0, "rgba(255,255,255,0.9)"); // apex (lamp)
		g.addColorStop(0.55, "rgba(255,255,255,0.35)");
		g.addColorStop(1, "rgba(255,255,255,0)"); // far end fades to nothing
		beamCtx.fillStyle = g;
		beamCtx.fillRect(0, 0, 4, 128);
	}
	const beamTexture = track(new CanvasTexture(beamCanvas));
	const beamMat = track(
		new MeshBasicMaterial({
			color: 0xfff2cc,
			map: beamTexture,
			transparent: true,
			opacity: 0,
			blending: AdditiveBlending,
			depthWrite: false,
			side: DoubleSide,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const beamGeo = track(new ConeGeometry(3.4, 60, 12, 1, true));
	beamGeo.rotateZ(-Math.PI / 2);
	beamGeo.translate(-30, 0, 0); // apex at the pivot, cone sweeping outward
	const beamPivot = new Group();
	beamPivot.position.y = towerY + 0.45;
	const beamA = new Mesh(beamGeo, beamMat);
	const beamB = new Mesh(beamGeo, beamMat);
	beamB.rotation.y = Math.PI;
	beamPivot.add(beamA, beamB);
	// Real lights ride the pivot too, so the sweep brushes the islands
	// and the ship as it passes — one per visual cone.
	const beamSpot = new SpotLight(0xffe8c0, 0, 110, 0.16, 0.7, 1);
	beamSpot.target.position.set(-40, -3, 0);
	const beamSpotB = new SpotLight(0xffe8c0, 0, 110, 0.16, 0.7, 1);
	beamSpotB.target.position.set(40, -3, 0);
	beamPivot.add(beamSpot, beamSpot.target, beamSpotB, beamSpotB.target);
	lighthouse.add(beamPivot);
	lighthouse.position.set(12, 4.6, -72);
	scene.add(lighthouse);

	return { beacon, beamPivot, beamMat, beamSpot, beamSpotB, lampGlowMat, whiteMat, darkMat };
}
