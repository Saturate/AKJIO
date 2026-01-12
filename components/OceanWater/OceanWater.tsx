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
	baseY: number; // Initial Y position at scroll=0
	size: number;
	opacity: number;
	twinkleSpeed: number;
	twinkleOffset: number;
	parallaxSpeed: number; // Individual parallax rate (0.1-0.2)
}

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
	const scrollYRef = useRef<number>(0);

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

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		const particles = particlesRef.current;
		const docHeight = Math.max(
			document.documentElement.scrollHeight,
			document.body.scrollHeight,
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

		const stars = starsRef.current;
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;
		const safeZone = 30; // Keep stars 30px away from waterline
		for (let i = 0; i < 25; i++) {
			const baseY = Math.random() * (headerBottom - safeZone);
			stars.push({
				x: Math.random() * canvas.width,
				y: baseY,
				baseY: baseY, // Store initial position for parallax
				size: 0.5 + Math.random() * 1.5, // Smaller stars: 0.5-2px
				opacity: 0.3 + Math.random() * 0.6,
				twinkleSpeed: 0.3 + Math.random() * 0.8,
				twinkleOffset: Math.random() * Math.PI * 2,
				parallaxSpeed: 0.1 + Math.random() * 0.1, // 0.1-0.2 range for varied depth
			});
		}

		const handleMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			mouseRef.current = { x, y };

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

		let animationFrameId: number;
		const animate = () => {
			scrollYRef.current = window.scrollY;
			timeRef.current += 0.016;
			const time = timeRef.current;

			const header = document.querySelector("header");
			const headerBottom = header ? header.getBoundingClientRect().bottom : 100;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			drawSkyGradient(ctx, canvas, headerBottom);

			if (resolvedTheme === "dark") {
				drawMoon(ctx, canvas);
				drawStars(ctx, canvas, time);
			}

			drawWaterSurface(ctx, canvas, time, headerBottom);

			if (resolvedTheme === "light") {
				updateParticles(ctx, canvas);
			}

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

	function drawSkyGradient(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
		headerBottom: number,
	) {
		// Add safe margin to cover wave oscillations (waves can go +/- 13px)
		const safeMargin = 25;
		const gradient = ctx.createLinearGradient(0, 0, 0, headerBottom + safeMargin);

		if (resolvedTheme === "dark") {
			gradient.addColorStop(0, "#0a1628");
			gradient.addColorStop(1, "#1a2a3a");
		} else {
			gradient.addColorStop(0, "#87CEEB");
			gradient.addColorStop(1, "#B0E2FF");
		}

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, headerBottom + safeMargin);
	}

	function drawWaterBody(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
		time: number,
	) {
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;

		// Start higher to overlap with wave oscillations (waves can go +/- 13px)
		const waterBodyStart = headerBottom - 25;
		const gradient = ctx.createLinearGradient(
			0,
			waterBodyStart,
			0,
			canvas.height,
		);
		gradient.addColorStop(0, getCSSVariable("--water-body-top"));
		gradient.addColorStop(0.4, getCSSVariable("--water-body-mid"));
		gradient.addColorStop(1, getCSSVariable("--water-body-deep"));

		ctx.fillStyle = gradient;
		ctx.fillRect(
			0,
			waterBodyStart,
			canvas.width,
			canvas.height - waterBodyStart,
		);

		ctx.save();
		ctx.globalAlpha = resolvedTheme === "dark" ? 0.03 : 0.05;
		for (let i = 0; i < 3; i++) {
			const x = (canvas.width / 4) * (i + 1) + Math.sin(time * 0.5 + i) * 50;
			const rayGradient = ctx.createLinearGradient(
				x - 30,
				headerBottom,
				x + 30,
				canvas.height,
			);
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
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;

		ctx.save();
		ctx.beginPath();

		ctx.moveTo(0, 0);
		ctx.lineTo(canvas.width, 0);

		const rightWave1 = Math.sin(canvas.width * 0.02 + time * 0.8) * 6;
		const rightWave2 = Math.cos(canvas.width * 0.015 - time * 0.6) * 4;
		const rightWave3 = Math.sin(canvas.width * 0.03 + time * 1.0) * 3;
		ctx.lineTo(
			canvas.width,
			headerBottom + rightWave1 + rightWave2 + rightWave3,
		);

		for (let x = canvas.width; x >= 0; x -= 1) {
			const wave1 = Math.sin(x * 0.02 + time * 0.8) * 6;
			const wave2 = Math.cos(x * 0.015 - time * 0.6) * 4;
			const wave3 = Math.sin(x * 0.03 + time * 1.0) * 3;
			const y = headerBottom + wave1 + wave2 + wave3;
			ctx.lineTo(x, y);
		}

		ctx.closePath();

		const waterGradient = ctx.createLinearGradient(0, 0, 0, headerBottom + 20);
		waterGradient.addColorStop(0, getCSSVariable("--water-top"));
		waterGradient.addColorStop(0.3, getCSSVariable("--water-transition"));
		waterGradient.addColorStop(0.7, getCSSVariable("--water-medium"));
		waterGradient.addColorStop(1, getCSSVariable("--water-bottom"));
		ctx.fillStyle = waterGradient;
		ctx.fill();

		ctx.restore();
	}

	function drawWaterSurface(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
		time: number,
		headerBottom: number,
	) {
		ctx.save();
		ctx.beginPath();

		const leftWave1 = Math.sin(0 * 0.02 + time * 0.8) * 6;
		const leftWave2 = Math.cos(0 * 0.015 - time * 0.6) * 4;
		const leftWave3 = Math.sin(0 * 0.03 + time * 1.0) * 3;
		ctx.moveTo(0, headerBottom + leftWave1 + leftWave2 + leftWave3);

		for (let x = 0; x <= canvas.width; x += 1) {
			const wave1 = Math.sin(x * 0.02 + time * 0.8) * 6;
			const wave2 = Math.cos(x * 0.015 - time * 0.6) * 4;
			const wave3 = Math.sin(x * 0.03 + time * 1.0) * 3;
			const y = headerBottom + wave1 + wave2 + wave3;
			ctx.lineTo(x, y);
		}

		ctx.lineTo(canvas.width, canvas.height);
		ctx.lineTo(0, canvas.height);
		ctx.closePath();

		const waterGradient = ctx.createLinearGradient(
			0,
			headerBottom,
			0,
			canvas.height,
		);
		waterGradient.addColorStop(0, getCSSVariable("--water-top"));
		waterGradient.addColorStop(0.3, getCSSVariable("--water-medium"));
		waterGradient.addColorStop(1, getCSSVariable("--water-body-deep"));

		ctx.fillStyle = waterGradient;
		ctx.fill();
		ctx.restore();
	}

	function updateParticles(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
	) {
		// Skip bubbles in dark mode, we want it to be cleaner while dark as darkness hides details.
		// Also they look a bit like stars.
		if (resolvedTheme === "dark") return;

		const particles = particlesRef.current;
		const header = document.querySelector("header");
		const headerBottom = header ? header.getBoundingClientRect().bottom : 100;
		const scrollY = window.scrollY;
		const docHeight = Math.max(
			document.documentElement.scrollHeight,
			document.body.scrollHeight,
		);

		particles.forEach((p) => {
			p.y += p.vy;

			if (p.y < 0) {
				p.y = docHeight;
				p.x = Math.random() * canvas.width;
			}

			const viewportY = p.y - scrollY;

			if (
				viewportY >= headerBottom &&
				viewportY >= 0 &&
				viewportY <= canvas.height
			) {
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

			ripple.radius += 1.0;
			ripple.strength *= 0.95;

			if (ripple.radius > ripple.maxRadius || ripple.strength < 0.01) {
				ripples.splice(i, 1);
				continue;
			}

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

	function drawStars(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
		time: number,
	) {
		const stars = starsRef.current;

		ctx.save();

		stars.forEach((star) => {
			star.y = star.baseY + scrollYRef.current * star.parallaxSpeed;

			if (star.y >= 0 && star.y <= canvas.height) {
				const twinkle =
					Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
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
		const moonBaseY = 80;
		const moonY = moonBaseY + scrollYRef.current * 0.3;
		const moonRadius = 40;

		if (moonY + moonRadius < 0 || moonY - moonRadius > canvas.height) {
			return;
		}

		ctx.save();

		const glowGradient = ctx.createRadialGradient(
			moonX,
			moonY,
			moonRadius * 0.5,
			moonX,
			moonY,
			moonRadius * 2,
		);
		glowGradient.addColorStop(0, "rgba(244, 241, 222, 0.3)");
		glowGradient.addColorStop(1, "rgba(244, 241, 222, 0)");
		ctx.fillStyle = glowGradient;
		ctx.beginPath();
		ctx.arc(moonX, moonY, moonRadius * 2, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = getCSSVariable("--moon-color");
		ctx.beginPath();
		ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
		ctx.fill();

		// Craters
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

	return <canvas ref={canvasRef} className={styles.oceanCanvas} />;
}
