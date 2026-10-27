import { ImageResponse } from "next/og";
import { iconSvg } from "@/lib/iconShapes";

export const contentType = "image/png";
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
	const src = `data:image/svg+xml;base64,${Buffer.from(iconSvg()).toString("base64")}`;
	return new ImageResponse(
		// eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>, next/image doesn't apply here.
		<img src={src} width={180} height={180} alt="" />,
		size,
	);
}
