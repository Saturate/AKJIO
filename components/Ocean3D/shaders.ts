// GLSL for the sky dome and the water block. The water shader does double
// duty: the top sheet (waves, foam rings, sun streak, lighthouse pool) and
// the vertical cross-section wall ("aquarium glass"), told apart by facet
// normal in the fragment shader.

export const SKY_VERT = /* glsl */ `
	varying vec3 vWorldPos;
	void main() {
		vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

export const SKY_FRAG = /* glsl */ `
	uniform vec3 uTop;
	uniform vec3 uHorizon;
	varying vec3 vWorldPos;
	void main() {
		float h = normalize(vWorldPos).y;
		vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.5, h));
		gl_FragColor = vec4(col, 1.0);
	}
`;

export const WATER_VERT = /* glsl */ `
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

export const WATER_FRAG = /* glsl */ `
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
	uniform vec2 uBeamDir;
	uniform float uBeamStrength;
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
		// Foam rings lapping the island shores; footprints match the rock
		// placements (x, z, radiusX, radiusZ). Living in the shader means
		// the foam rides the waves instead of floating as a separate mesh.
		vec4 islands[4];
		islands[0] = vec4(-55.0, -120.0, 17.5, 12.5);
		islands[1] = vec4(-42.0, -112.0, 8.5, 7.5);
		islands[2] = vec4(15.0, -75.0, 10.5, 8.5);
		islands[3] = vec4(24.0, -71.0, 5.5, 5.5);
		float foamRing = 0.0;
		for (int i = 0; i < 4; i++) {
			vec2 rel = vec2(
				(vPos.x - islands[i].x) / islands[i].z,
				(vPos.z - islands[i].y) / islands[i].w
			);
			float d = length(rel);
			float ring = smoothstep(0.8, 1.0, d) * smoothstep(1.3, 1.05, d);
			foamRing = max(foamRing, ring);
		}
		foamRing *= 0.55 + 0.45 * sin(vPos.x * 1.7 + vPos.z * 1.3 - uTime * 1.6);
		col = mix(col, uFoam, foamRing * 0.75);
		float cx = uSunX * dist;
		float streak = exp(-pow(vPos.x - cx, 2.0) / (3.0 + 360.0 * dist * dist));
		float shimmer = 0.6 + 0.4 * sin(vPos.x * 2.4 + vPos.z * 3.1 + uTime * 2.2);
		// The shimmer's world-space stripes alias into banding at range:
		// fade to a smooth glow toward the horizon.
		shimmer = mix(shimmer, 0.65, smoothstep(0.25, 0.7, dist));
		col += uSunColor * streak * shimmer * uGlint * dist;
		// Lighthouse sweep: a warm light pool travels across the waves where
		// the rotating beam points (bi-directional, so abs of the alignment).
		vec2 toFrag = vPos.xz - vec2(12.0, -72.0);
		float lampDist = length(toFrag);
		float align = abs(dot(toFrag / max(lampDist, 0.001), uBeamDir));
		float pool = smoothstep(0.978, 0.999, align) * smoothstep(85.0, 12.0, lampDist);
		col += vec3(1.0, 0.93, 0.75) * pool * uBeamStrength;
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
