import { iconSvg } from "@/lib/iconShapes";

export const contentType = "image/svg+xml";
export const size = { width: 32, height: 32 };

export default function Icon() {
	return new Response(iconSvg(), { headers: { "Content-Type": contentType } });
}
