import { TOCEntry } from "@/utils/generateTableOfContentsFromMarkdown";
import styles from "./TableOfContents.module.css";

interface TOCItemProps {
	entry: TOCEntry;
	isActive: boolean;
	onClick: (slug: string) => void;
	upperDepth: number;
	lowerDepth: number;
}

function getItemOffset(depth: number): number {
	if (depth <= 2) return 14;
	if (depth === 3) return 26;
	return 36;
}

function getLineOffset(depth: number): number {
	return depth >= 3 ? 10 : 0;
}

export default function TOCItem({ entry, isActive, onClick, upperDepth, lowerDepth }: TOCItemProps) {
	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		onClick(entry.slug);
	};

	const offset = getLineOffset(entry.level);
	const upperOffset = getLineOffset(upperDepth);
	const lowerOffset = getLineOffset(lowerDepth);

	return (
		<a
			href={entry.slug}
			onClick={handleClick}
			style={{
				paddingInlineStart: `${getItemOffset(entry.level)}px`,
			}}
			className={`${styles.tocItem} ${isActive ? styles.tocItemActive : ""}`}
			data-active={isActive}
		>
			{offset !== upperOffset && (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					className={styles.tocConnector}
				>
					<line
						x1={upperOffset}
						y1="0"
						x2={offset}
						y2="12"
						stroke="currentColor"
						strokeWidth="1"
					/>
				</svg>
			)}
			<div
				className={`${styles.tocVerticalLine} ${
					offset !== upperOffset ? styles.tocVerticalLineTop : ""
				} ${offset !== lowerOffset ? styles.tocVerticalLineBottom : ""}`}
				style={{
					insetInlineStart: `${offset}px`,
				}}
			/>
			{entry.text}
		</a>
	);
}
