"use client";

import { useRef, useEffect } from "react";
import styles from "./OceanWater.module.css";

interface Particle {
	x: number;
	y: number;
	vy: number;
	size: number;
	opacity: number;
}

interface Ripple {
	x: number;
	y: number;
	radius: number;
	maxRadius: number;
	strength: number;
}

export default function OceanWater() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const ripplesRef = useRef<Ripple[]>([]);
	const mouseRef = useRef({ x: 0, y: 0 });
	const timeRef = useRef(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Set canvas size to viewport
		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		// Initialize particles (water body zone) in document space
		const particles = particlesRef.current;
		const docHeight = Math.max(
			document.documentElement.scrollHeight,
			document.body.scrollHeight
		);
		for (let i = 0; i < 50; i++) {
			particles.push({
				x: Math.random() * canvas.width,
				y: 100 + Math.random() * (docHeight - 100), // Y in document space
				vy: -0.2 - Math.random() * 0.3, // Slow rise
				size: 1 + Math.random() * 2,
				opacity: 0.3 + Math.random() * 0.4,
			});
		}

		// Mouse move handler
		const handleMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			mouseRef.current = { x, y };

			// Create ripple if in waterline zone (near header bottom)
			const header = document.querySelector("header");
			const headerBottom = header ? header.getBoundingClientRect().bottom : 100;

			if (y > headerBottom - 30 && y < headerBottom + 30) {
				ripplesRef.current.push({
					x,
					y,
					radius: 0,
					maxRadius: 40 + Math.random() * 20,
					strength: 1,
				});
			}
		};

		canvas.addEventListener("mousemove", handleMouseMove);

		// Animation loop
		const animate = () => {
			timeRef.current += 0.016;
			const time = timeRef.current;

			// Clear canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// === WATER BODY ZONE (Below) ===
			drawWaterBody(ctx, canvas, time);

			// === WATERLINE ZONE (Top 100px) ===
			drawWaterline(ctx, canvas, time);

			// Update and draw particles
			updateParticles(ctx, canvas);

			// Update and draw ripples
			updateRipples(ctx);

			requestAnimationFrame(animate);
		};

		animate();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			canvas.removeEventListener("mousemove", handleMouseMove);
		};
	}, []);

	function drawWaterBody(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
		time: number,
	) {
		// Get header bottom position in viewport (accounts for scrolling)
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;

		// Start higher to overlap with wave oscillations (waves can go +/- 13px)
		const waterBodyStart = headerBottom - 25;

		// Vertical gradient - continues from waterline gradient, darker at depth
		const gradient = ctx.createLinearGradient(0, waterBodyStart, 0, canvas.height);
		gradient.addColorStop(0, "#4a90c4"); // Matches waterline bottom color
		gradient.addColorStop(0.4, "#3b7db0");
		gradient.addColorStop(1, "#2d5a7b"); // Deep ocean at bottom

		ctx.fillStyle = gradient;
		ctx.fillRect(0, waterBodyStart, canvas.width, canvas.height - waterBodyStart);

		// Very subtle light rays
		ctx.save();
		ctx.globalAlpha = 0.05;
		for (let i = 0; i < 3; i++) {
			const x = (canvas.width / 4) * (i + 1) + Math.sin(time * 0.5 + i) * 50;
			const rayGradient = ctx.createLinearGradient(x - 30, headerBottom, x + 30, canvas.height);
			rayGradient.addColorStop(0, "#a0d4f0");
			rayGradient.addColorStop(1, "transparent");
			ctx.fillStyle = rayGradient;
			ctx.fillRect(x - 30, headerBottom, 60, canvas.height - headerBottom);
		}
		ctx.restore();
	}

	function drawWaterline(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
		time: number,
	) {
		// Get header bottom position in viewport (accounts for scrolling)
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;

		// Draw water surface with waves - fills from top of canvas to wavy waterline
		ctx.save();
		ctx.beginPath();

		// Start from top-left corner
		ctx.moveTo(0, 0);
		ctx.lineTo(canvas.width, 0);

		// Draw right edge down to waterline
		const rightWave1 = Math.sin(canvas.width * 0.02 + time * 1.5) * 6;
		const rightWave2 = Math.cos(canvas.width * 0.015 - time * 1.2) * 4;
		const rightWave3 = Math.sin(canvas.width * 0.03 + time * 1.8) * 3;
		ctx.lineTo(canvas.width, headerBottom + rightWave1 + rightWave2 + rightWave3);

		// Create smooth wave path at header bottom (right to left)
		for (let x = canvas.width; x >= 0; x -= 1) {
			const wave1 = Math.sin(x * 0.02 + time * 1.5) * 6;
			const wave2 = Math.cos(x * 0.015 - time * 1.2) * 4;
			const wave3 = Math.sin(x * 0.03 + time * 1.8) * 3;
			const y = headerBottom + wave1 + wave2 + wave3;
			ctx.lineTo(x, y);
		}

		// Close path back to top-left
		ctx.closePath();

		// Fill with gradient from sky to water colors - darker at top, lighter near waterline
		const waterGradient = ctx.createLinearGradient(0, 0, 0, headerBottom + 20);
		waterGradient.addColorStop(0, "#4890c0"); // Darker blue at top
		waterGradient.addColorStop(0.3, "#5a9fc7"); // Transition
		waterGradient.addColorStop(0.7, "#87ceeb"); // Medium sky blue
		waterGradient.addColorStop(1, "#b8e3f5"); // Light sky blue at waterline
		ctx.fillStyle = waterGradient;
		ctx.fill();

		ctx.restore();
	}

	function updateParticles(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
	) {
		const particles = particlesRef.current;
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;
		const scrollY = window.scrollY;
		const docHeight = Math.max(
			document.documentElement.scrollHeight,
			document.body.scrollHeight
		);

		particles.forEach((p) => {
			// Update position in document space (slow rise)
			p.y += p.vy;

			// Reset if reaches top of document
			if (p.y < 0) {
				p.y = docHeight;
				p.x = Math.random() * canvas.width;
			}

			// Convert from document space to viewport space for drawing
			const viewportY = p.y - scrollY;

			// Only draw if particle is in viewport and below header
			if (viewportY >= headerBottom && viewportY >= 0 && viewportY <= canvas.height) {
				ctx.save();
				ctx.globalAlpha = p.opacity;
				ctx.fillStyle = "#a0c4e0";
				ctx.beginPath();
				ctx.arc(p.x, viewportY, p.size, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}
		});
	}

	function updateRipples(ctx: CanvasRenderingContext2D) {
		const ripples = ripplesRef.current;

		for (let i = ripples.length - 1; i >= 0; i--) {
			const ripple = ripples[i];

			// Update
			ripple.radius += 1.5;
			ripple.strength *= 0.95;

			// Remove if done
			if (ripple.radius > ripple.maxRadius || ripple.strength < 0.01) {
				ripples.splice(i, 1);
				continue;
			}

			// Draw
			ctx.save();
			ctx.globalAlpha = ripple.strength * 0.5;
			ctx.strokeStyle = "#cfe8fa";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();
		}
	}

	return (
		<canvas ref={canvasRef} className={styles.oceanCanvas} />
	);
}
