import { Color, MeshStandardMaterial } from "three";
import { DAY } from "./palette";
import { makeRock } from "./geometry";
import type { SceneCtx } from "./types";

// Icebergs, not cutouts: the rock continues below the waterline, and its
// submerged part fades into the water color with depth so it reads as a
// pale floating-island silhouette instead of a dark unfogged blob.
// Footprints are mirrored by the foam rings hardcoded in WATER_FRAG.
export function buildIslands(ctx: SceneCtx, glassShallowColor: Color) {
	const { scene, track } = ctx;
	const rockMat = track(
		new MeshStandardMaterial({ color: DAY.rock, flatShading: true, fog: false }),
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

	return { rockMat };
}
