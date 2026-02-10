import { ImageResponse } from "next/og";
import {
	OG_WIDTH,
	OG_HEIGHT,
	OG_SCALE as S,
	OG_RENDER_WIDTH,
	OG_RENDER_HEIGHT,
	colors,
} from "@/lib/og/theme";
import { loadOgFonts } from "@/lib/og/fonts";
import { OgBackground } from "@/lib/og/OgBackground";

export const alt = "AKJ.IO - Allan Kimmer Jensen";
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = "image/png";

export default async function Image() {
	const fonts = await loadOgFonts();

	return new ImageResponse(
		(
			<OgBackground>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						justifyContent: "center",
						gap: 8 * S,
					}}
				>
					<span
						style={{
							fontFamily: "Jersey 25",
							fontSize: 72 * S,
							color: colors.text,
							lineHeight: 1,
						}}
					>
						AKJ.IO
					</span>

					<span
						style={{
							fontSize: 28 * S,
							color: colors.textMuted,
							fontWeight: 400,
						}}
					>
						Allan Kimmer Jensen
					</span>

					<div
						style={{
							width: 60 * S,
							height: 3 * S,
							background: colors.accent,
							marginTop: 16 * S,
							marginBottom: 16 * S,
							borderRadius: 2 * S,
						}}
					/>

					<div
						style={{
							display: "flex",
							flexDirection: "column",
							fontSize: 24 * S,
							color: colors.text,
							lineHeight: 1.5,
						}}
					>
						<span>Software engineer and</span>
						<span>security enthusiast.</span>
					</div>

					<span
						style={{
							fontSize: 20 * S,
							color: colors.textMuted,
							marginTop: 8 * S,
							lineHeight: 1.5,
						}}
					>
						Writing about CTF challenges, web security, and software
						architecture.
					</span>

					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: 8 * S,
							marginTop: 16 * S,
						}}
					>
						{["Security", "CTF", "Web Dev", "Architecture"].map((tag) => (
							<span
								key={tag}
								style={{
									fontSize: 16 * S,
									color: colors.accent,
									padding: `${4 * S}px ${12 * S}px`,
									border: `${S}px solid ${colors.tagBorder}`,
									borderRadius: 6 * S,
									background: colors.tagBg,
								}}
							>
								{tag}
							</span>
						))}
					</div>
				</div>

				<span
					style={{
						position: "absolute",
						bottom: 50 * S,
						right: 60 * S,
						fontSize: 20 * S,
						color: colors.textMuted,
						fontWeight: 400,
					}}
				>
					akj.io
				</span>
			</OgBackground>
		),
		{ width: OG_RENDER_WIDTH, height: OG_RENDER_HEIGHT, fonts },
	);
}
