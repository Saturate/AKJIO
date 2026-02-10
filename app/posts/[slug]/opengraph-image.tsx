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
import { getPostFrontmatter } from "@/lib/og/getPostFrontmatter";
import { format } from "date-fns";

export const alt = "AKJ.IO blog post";
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = "image/png";

function titleFontSize(len: number) {
	if (len > 80) return 44 * S;
	if (len > 60) return 48 * S;
	return 52 * S;
}

export default async function Image({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const fm = getPostFrontmatter(slug);
	const fonts = await loadOgFonts();

	const title = fm?.title ?? slug;
	const subtitle = fm?.subtitle ?? fm?.description;
	const tags = fm?.tags ?? [];
	const dateStr = fm?.date
		? format(new Date(fm.date), "MMMM d, yyyy")
		: undefined;
	const isLong = title.length > 60;

	return new ImageResponse(
		(
			<OgBackground>
				{/* Header */}
				<span
					style={{
						fontFamily: "Jersey 25",
						fontSize: 32 * S,
						color: colors.textMuted,
						lineHeight: 1,
					}}
				>
					AKJ.IO
				</span>

				{/* Title area */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						justifyContent: "center",
						gap: (isLong ? 8 : 12) * S,
						marginTop: 10 * S,
					}}
				>
					<span
						style={{
							fontFamily: "Jersey 25",
							fontSize: titleFontSize(title.length),
							color: colors.text,
							lineHeight: 1.2,
						}}
					>
						{title}
					</span>

					{subtitle && (
						<span
							style={{
								fontSize: (isLong ? 20 : 22) * S,
								color: colors.textMuted,
								lineHeight: 1.4,
								maxWidth: 900 * S,
								overflow: "hidden",
								maxHeight: (isLong ? 56 : 62) * S,
							}}
						>
							{subtitle}
						</span>
					)}

					{/* Tags */}
					{tags.length > 0 && (
						<div
							style={{
								display: "flex",
								flexWrap: "wrap",
								gap: 8 * S,
								marginTop: (isLong ? 6 : 12) * S,
							}}
						>
							{tags.slice(0, 5).map((tag) => (
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
					)}

					{dateStr && (
						<span
							style={{
								fontSize: 18 * S,
								color: colors.textMuted,
								marginTop: 8 * S,
							}}
						>
							{dateStr}
						</span>
					)}
				</div>
			</OgBackground>
		),
		{ width: OG_RENDER_WIDTH, height: OG_RENDER_HEIGHT, fonts },
	);
}
