import { BufferGeometry, IcosahedronGeometry, Material, Mesh } from "three";

// Position-hashed jitter: duplicated vertices (non-indexed polyhedra) get
// identical offsets, so faces stay welded while the silhouette gets craggy.
export function jitterByPosition(geometry: BufferGeometry, amount: number) {
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

export function makeRock(material: Material, jitter = 0.35): Mesh {
	const geometry = new IcosahedronGeometry(1, 1);
	jitterByPosition(geometry, jitter);
	return new Mesh(geometry, material);
}
