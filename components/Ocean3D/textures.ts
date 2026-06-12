import { CanvasTexture, SRGBColorSpace } from "three";
import { getIlluminationFraction } from "@/lib/moonPhase";

export function makeGlowTexture(): CanvasTexture {
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
	return new CanvasTexture(canvas);
}

// Moon with the old site's craters, optionally shaded by the real lunar
// phase (half-circle + ellipse terminator, clipped to the disc).
export function makeMoonTexture(phase: number | null): CanvasTexture {
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

		// Soft-edged maria laid out like the real near side: Procellarum on
		// the left limb, Imbrium upper left, Serenitatis/Tranquillitatis in
		// the upper middle, Fecunditatis/Nectaris lower right.
		ctx.save();
		ctx.beginPath();
		ctx.arc(c, c, r, 0, Math.PI * 2);
		ctx.clip();
		const mare = (mx: number, my: number, mr: number, alpha: number) => {
			const px = c + mx * r;
			const py = c + my * r;
			const g = ctx.createRadialGradient(px, py, 0, px, py, mr * r);
			g.addColorStop(0, `rgba(166, 163, 145, ${alpha})`);
			g.addColorStop(0.7, `rgba(166, 163, 145, ${alpha * 0.8})`);
			g.addColorStop(1, "rgba(166, 163, 145, 0)");
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(px, py, mr * r, 0, Math.PI * 2);
			ctx.fill();
		};
		mare(-0.52, -0.12, 0.3, 0.5); // Oceanus Procellarum (upper)
		mare(-0.48, 0.22, 0.24, 0.45); // Oceanus Procellarum (lower)
		mare(-0.22, -0.38, 0.28, 0.55); // Mare Imbrium
		mare(0.16, -0.36, 0.2, 0.5); // Mare Serenitatis
		mare(0.34, -0.1, 0.21, 0.5); // Mare Tranquillitatis
		mare(0.52, 0.14, 0.15, 0.45); // Mare Fecunditatis
		mare(0.28, 0.28, 0.11, 0.4); // Mare Nectaris
		mare(-0.18, 0.32, 0.13, 0.35); // Mare Nubium
		// A few small craters in the bright highlands.
		ctx.fillStyle = "rgba(160, 157, 140, 0.4)";
		const craters: [number, number, number][] = [
			[-0.3, 0.05, 0.045], // Copernicus
			[0.05, 0.5, 0.035], // Albategnius-ish
			[-0.55, 0.5, 0.03],
			[0.55, -0.42, 0.03],
		];
		for (const [cx, cy, cr] of craters) {
			ctx.beginPath();
			ctx.arc(c + cx * r, c + cy * r, cr * r, 0, Math.PI * 2);
			ctx.fill();
		}
		// Tycho: bright spot near the southern limb.
		const tycho = ctx.createRadialGradient(
			c - 0.08 * r,
			c + 0.62 * r,
			0,
			c - 0.08 * r,
			c + 0.62 * r,
			0.12 * r,
		);
		tycho.addColorStop(0, "rgba(255, 253, 240, 0.9)");
		tycho.addColorStop(1, "rgba(255, 253, 240, 0)");
		ctx.fillStyle = tycho;
		ctx.beginPath();
		ctx.arc(c - 0.08 * r, c + 0.62 * r, 0.12 * r, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();

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
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	return texture;
}
