import {
	AdditiveBlending,
	BoxGeometry,
	ConeGeometry,
	CylinderGeometry,
	Group,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	SphereGeometry,
} from "three";
import type { SceneCtx } from "./types";

interface SharedMats {
	whiteMat: MeshStandardMaterial;
	darkMat: MeshStandardMaterial;
}

// A little fishing boat: red hull with a pointed bow and white gunwale,
// white wheelhouse with a window band, short mast with a pennant, and
// orange buoys hanging over the side.
export function buildShip(ctx: SceneCtx, { whiteMat, darkMat }: SharedMats) {
	const { scene, track, aboveWaterClip } = ctx;
	const orangeMat = track(
		new MeshStandardMaterial({
			color: 0xe8622d,
			flatShading: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const ship = new Group();
	const hullMat = track(
		new MeshStandardMaterial({
			color: 0xb5483c,
			flatShading: true,
			fog: false,
			clippingPlanes: [aboveWaterClip],
		}),
	);
	const hull = new Mesh(track(new BoxGeometry(3.4, 1.0, 1.6)), hullMat);
	hull.position.y = 0.5;
	ship.add(hull);
	const bow = new Mesh(track(new ConeGeometry(0.8, 1.4, 4)), hullMat);
	bow.rotation.z = -Math.PI / 2;
	bow.rotation.x = Math.PI / 4;
	bow.position.set(2.2, 0.5, 0);
	ship.add(bow);
	const gunwale = new Mesh(track(new BoxGeometry(3.5, 0.16, 1.7)), whiteMat);
	gunwale.position.y = 1.04;
	ship.add(gunwale);
	const wheelhouse = new Mesh(track(new BoxGeometry(1.25, 1.0, 1.3)), whiteMat);
	wheelhouse.position.set(-0.7, 1.6, 0);
	ship.add(wheelhouse);
	const windowBand = new Mesh(track(new BoxGeometry(1.32, 0.32, 1.36)), darkMat);
	windowBand.position.set(-0.7, 1.82, 0);
	ship.add(windowBand);
	const wheelhouseRoof = new Mesh(track(new BoxGeometry(1.45, 0.14, 1.5)), hullMat);
	wheelhouseRoof.position.set(-0.7, 2.16, 0);
	ship.add(wheelhouseRoof);
	const mast = new Mesh(track(new CylinderGeometry(0.045, 0.06, 1.8, 6)), darkMat);
	mast.position.set(0.7, 1.9, 0);
	ship.add(mast);
	const boom = new Mesh(track(new CylinderGeometry(0.035, 0.035, 1.5, 6)), darkMat);
	boom.rotation.z = 1.15;
	boom.position.set(0.05, 2.25, 0);
	ship.add(boom);
	const pennant = new Mesh(track(new ConeGeometry(0.14, 0.4, 4)), orangeMat);
	pennant.rotation.z = -Math.PI / 2;
	pennant.position.set(0.92, 2.75, 0);
	ship.add(pennant);
	// Navigation lights: red to port, green to starboard (bow points +X, so
	// port is -Z). Additive dots that only glow at night; opacity is driven
	// by the palette mix and a blink pulse in the render loop.
	const navLightGeo = track(new SphereGeometry(0.11, 8, 6));
	const navPortMat = track(
		new MeshBasicMaterial({
			color: 0xff3b30,
			transparent: true,
			opacity: 0,
			blending: AdditiveBlending,
			depthWrite: false,
			fog: false,
		}),
	);
	const navStarboardMat = track(
		new MeshBasicMaterial({
			color: 0x30e85a,
			transparent: true,
			opacity: 0,
			blending: AdditiveBlending,
			depthWrite: false,
			fog: false,
		}),
	);
	// Halo spheres make the dots read as lights from across the scene
	// instead of tiny colored pixels.
	const navHaloGeo = track(new SphereGeometry(0.28, 8, 6));
	const navPortHaloMat = track(navPortMat.clone());
	const navStarboardHaloMat = track(navStarboardMat.clone());
	const navPort = new Mesh(navLightGeo, navPortMat);
	// Proud of the wheelhouse wall (half-width 0.65), so the sphere and at
	// least half the halo clear the depth test instead of being buried.
	navPort.position.set(-0.7, 1.5, -0.82);
	navPort.add(new Mesh(navHaloGeo, navPortHaloMat));
	const navStarboard = new Mesh(navLightGeo, navStarboardMat);
	navStarboard.position.set(-0.7, 1.5, 0.82);
	navStarboard.add(new Mesh(navHaloGeo, navStarboardHaloMat));
	ship.add(navPort, navStarboard);
	const buoyGeo = track(new SphereGeometry(0.17, 8, 6));
	const buoyA = new Mesh(buoyGeo, orangeMat);
	buoyA.position.set(0.4, 0.62, 0.85);
	const buoyB = new Mesh(buoyGeo, orangeMat);
	buoyB.position.set(-0.6, 0.62, 0.85);
	ship.add(buoyA, buoyB);
	// Start position and heading come from scatter(): the ship sails in from
	// off-screen and eases to a stop at a seeded anchorage in open water.
	ship.position.set(27, -0.1, -55);
	scene.add(ship);

	return { ship, navPortMat, navStarboardMat, navPortHaloMat, navStarboardHaloMat };
}
