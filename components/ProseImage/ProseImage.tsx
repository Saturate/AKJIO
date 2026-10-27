import Image from "next/image";

type Props = { src: string; alt: string; width?: number; height?: number };

// Markdown images. Sizing and the click-to-enlarge viewer come from .prose img and ImageViewer,
// which also cover images written as raw JSX in MDX (those skip the component mapping).
export default function ProseImage({ src, alt, width, height }: Props) {
	if (width && height) {
		return (
			<Image
				src={src}
				alt={alt}
				width={width}
				height={height}
				sizes="(max-width: 760px) 100vw, 760px"
			/>
		);
	}
	// eslint-disable-next-line @next/next/no-img-element -- no intrinsic size to give next/image (markdown images)
	return <img src={src} alt={alt} loading="lazy" />;
}
