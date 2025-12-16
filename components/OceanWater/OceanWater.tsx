"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";
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

interface Star {
	x: number;
	y: number;
	size: number;
	opacity: number;
	twinkleSpeed: number;
	twinkleOffset: number;
}

// Helper function to get CSS variable value
function getCSSVariable(name: string): string {
	if (typeof window === "undefined") return "";
	return getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
}

export default function OceanWater() {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [themeReady, setThemeReady] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const ripplesRef = useRef<Ripple[]>([]);
	const starsRef = useRef<Star[]>([]);
	const mouseRef = useRef({ x: 0, y: 0 });
	const timeRef = useRef(0);

	// Prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	// Wait for theme to be ready (either resolvedTheme is set, or a short delay has passed)
	useEffect(() => {
		if (resolvedTheme) {
			setThemeReady(true);
		} else {
			// Fallback: allow canvas to init after a short delay even if resolvedTheme is undefined
			const timer = setTimeout(() => setThemeReady(true), 100);
			return () => clearTimeout(timer);
		}
	}, [resolvedTheme]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Wait for theme to be ready before initializing canvas
		if (!themeReady) {
			return;
		}

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
				vy: -0.1 - Math.random() * 0.15, // Slow rise
				size: 1 + Math.random() * 2,
				opacity: 0.3 + Math.random() * 0.4,
			});
		}

		// Initialize stars for night mode
		const stars = starsRef.current;
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;
		const safeZone = 30; // Keep stars 30px away from waterline
		for (let i = 0; i < 25; i++) {
			stars.push({
				x: Math.random() * canvas.width,
				y: Math.random() * (headerBottom - safeZone), // Stay above waterline with safe zone
				size: 0.5 + Math.random() * 1.5, // Smaller stars: 0.5-2px
				opacity: 0.3 + Math.random() * 0.6,
				twinkleSpeed: 0.3 + Math.random() * 0.8,
				twinkleOffset: Math.random() * Math.PI * 2,
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
		let animationFrameId: number;
		const animate = () => {
			timeRef.current += 0.016;
			const time = timeRef.current;

			// Clear canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// === WATER BODY ZONE (Below) ===
			drawWaterBody(ctx, canvas, time);

			// === WATERLINE ZONE (Top 100px) ===
			drawWaterline(ctx, canvas, time);

			// === DARK MODE ELEMENTS (drawn after waterline so they're visible) ===
			if (resolvedTheme === "dark") {
				drawStars(ctx, time);
				drawMoon(ctx, canvas);
			}

			// Update and draw particles
			updateParticles(ctx, canvas);

			// Update and draw ripples
			updateRipples(ctx);

			animationFrameId = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			canvas.removeEventListener("mousemove", handleMouseMove);
			cancelAnimationFrame(animationFrameId);
		};
	}, [resolvedTheme, themeReady]);

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
		gradient.addColorStop(0, getCSSVariable("--water-body-top"));
		gradient.addColorStop(0.4, getCSSVariable("--water-body-mid"));
		gradient.addColorStop(1, getCSSVariable("--water-body-deep"));

		ctx.fillStyle = gradient;
		ctx.fillRect(0, waterBodyStart, canvas.width, canvas.height - waterBodyStart);

		// Very subtle light/moonlight rays
		ctx.save();
		ctx.globalAlpha = resolvedTheme === "dark" ? 0.03 : 0.05;
		for (let i = 0; i < 3; i++) {
			const x = (canvas.width / 4) * (i + 1) + Math.sin(time * 0.5 + i) * 50;
			const rayGradient = ctx.createLinearGradient(x - 30, headerBottom, x + 30, canvas.height);
			rayGradient.addColorStop(0, getCSSVariable("--light-ray-color"));
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
		const rightWave1 = Math.sin(canvas.width * 0.02 + time * 0.8) * 6;
		const rightWave2 = Math.cos(canvas.width * 0.015 - time * 0.6) * 4;
		const rightWave3 = Math.sin(canvas.width * 0.03 + time * 1.0) * 3;
		ctx.lineTo(canvas.width, headerBottom + rightWave1 + rightWave2 + rightWave3);

		// Create smooth wave path at header bottom (right to left)
		for (let x = canvas.width; x >= 0; x -= 1) {
			const wave1 = Math.sin(x * 0.02 + time * 0.8) * 6;
			const wave2 = Math.cos(x * 0.015 - time * 0.6) * 4;
			const wave3 = Math.sin(x * 0.03 + time * 1.0) * 3;
			const y = headerBottom + wave1 + wave2 + wave3;
			ctx.lineTo(x, y);
		}

		// Close path back to top-left
		ctx.closePath();

		// Fill with gradient from sky to water colors using CSS variables
		const waterGradient = ctx.createLinearGradient(0, 0, 0, headerBottom + 20);
		waterGradient.addColorStop(0, getCSSVariable("--water-top"));
		waterGradient.addColorStop(0.3, getCSSVariable("--water-transition"));
		waterGradient.addColorStop(0.7, getCSSVariable("--water-medium"));
		waterGradient.addColorStop(1, getCSSVariable("--water-bottom"));
		ctx.fillStyle = waterGradient;
		ctx.fill();

		ctx.restore();
	}

	function updateParticles(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
	) {
		// Skip bubbles in dark mode (they could look like stars)
		if (resolvedTheme === "dark") return;

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
				ctx.fillStyle = getCSSVariable("--particle-color");
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
			ripple.radius += 1.0;
			ripple.strength *= 0.95;

			// Remove if done
			if (ripple.radius > ripple.maxRadius || ripple.strength < 0.01) {
				ripples.splice(i, 1);
				continue;
			}

			// Draw
			ctx.save();
			ctx.globalAlpha = ripple.strength * 0.5;
			ctx.strokeStyle = getCSSVariable("--ripple-color");
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();
		}
	}

	function drawStars(ctx: CanvasRenderingContext2D, time: number) {
		const stars = starsRef.current;
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;

		ctx.save();

		stars.forEach((star) => {
			// Only draw star if it's within the visible sky area (header)
			if (star.y >= 0 && star.y <= headerBottom) {
				// Twinkling effect
				const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
				ctx.globalAlpha = star.opacity * twinkle;
				ctx.fillStyle = getCSSVariable("--star-color");
				ctx.beginPath();
				ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
				ctx.fill();
			}
		});

		ctx.restore();
	}

	function drawMoon(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;

		const moonX = canvas.width * 0.8;
		// Fixed position from top of viewport (no parallax effect)
		const moonY = 80;
		const moonRadius = 40;

		// Only draw if moon is within header area
		if (moonY + moonRadius < 0 || moonY - moonRadius > headerBottom) {
			return;
		}

		ctx.save();

		// Moon glow
		const glowGradient = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 2);
		glowGradient.addColorStop(0, "rgba(244, 241, 222, 0.3)");
		glowGradient.addColorStop(1, "rgba(244, 241, 222, 0)");
		ctx.fillStyle = glowGradient;
		ctx.beginPath();
		ctx.arc(moonX, moonY, moonRadius * 2, 0, Math.PI * 2);
		ctx.fill();

		// Moon body
		ctx.fillStyle = getCSSVariable("--moon-color");
		ctx.beginPath();
		ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
		ctx.fill();

		// Moon craters (simple dark circles)
		ctx.fillStyle = "rgba(200, 197, 180, 0.3)";
		ctx.beginPath();
		ctx.arc(moonX - 10, moonY - 5, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(moonX + 12, moonY + 8, 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(moonX + 5, moonY - 15, 5, 0, Math.PI * 2);
		ctx.fill();

		ctx.restore();
	}

	if (!mounted) {
		return null;
	}

	return (
		<canvas ref={canvasRef} className={styles.oceanCanvas} />
	);
}
