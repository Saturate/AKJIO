import { useState, useEffect } from "react";

export interface DeviceCapabilities {
	isMobile: boolean;
	pixelRatio: number;
	reducedMotion: boolean;
	supportsWebGL: boolean;
}

export function useDeviceCapabilities(): DeviceCapabilities {
	const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
		isMobile: false,
		pixelRatio: 1,
		reducedMotion: false,
		supportsWebGL: true,
	});

	useEffect(() => {
		// Check if mobile
		const isMobile =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent,
			) || window.innerWidth < 768;

		// Get pixel ratio (capped at 2 for performance)
		const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

		// Check for reduced motion preference
		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		// Check WebGL support
		const canvas = document.createElement("canvas");
		const supportsWebGL = !!(
			canvas.getContext("webgl") || canvas.getContext("webgl2")
		);

		setCapabilities({
			isMobile,
			pixelRatio,
			reducedMotion,
			supportsWebGL,
		});
	}, []);

	return capabilities;
}
