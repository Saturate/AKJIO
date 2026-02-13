"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from "@/components/Collapsible/Collapsible";
import {
	useActiveAnchor,
	useActiveAnchors,
} from "@/hooks/useActiveHeading";
import { TOCEntry } from "@/utils/generateTableOfContentsFromMarkdown";
import styles from "./MobileTocPopover.module.css";

function flattenEntries(entries: TOCEntry[]): TOCEntry[] {
	return entries.reduce((acc: TOCEntry[], entry) => {
		acc.push(entry);
		if (entry.children.length > 0) {
			acc.push(...flattenEntries(entry.children));
		}
		return acc;
	}, []);
}

interface MobileTocPopoverProps {
	entries: TOCEntry[];
	introLabel: string;
}

export default function MobileTocPopover({ entries, introLabel }: MobileTocPopoverProps) {
	const headerRef = useRef<HTMLElement>(null);
	const placeholderRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [isStuck, setIsStuck] = useState(false);
	const active = useActiveAnchor();
	const activeAnchors = useActiveAnchors();
	const allEntries = useMemo(() => flattenEntries(entries), [entries]);

	const selectedIndex = useMemo(
		() => allEntries.findIndex((item) => active === item.slug.slice(1)),
		[allEntries, active],
	);

	const atIntro = selectedIndex === -1;
	const showItem = !atIntro && !open;

	useEffect(() => {
		const placeholder = placeholderRef.current;
		if (!placeholder) return;

		function onScroll() {
			setIsStuck(placeholder!.getBoundingClientRect().top <= 0);
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		function onClick(e: MouseEvent) {
			if (!open) return;
			if (
				headerRef.current &&
				!headerRef.current.contains(e.target as HTMLElement)
			) {
				setOpen(false);
			}
		}

		window.addEventListener("click", onClick);
		return () => window.removeEventListener("click", onClick);
	}, [open]);

	const handleLinkClick = (slug: string) => {
		const el = document.querySelector(slug);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
		}
		setOpen(false);
	};

	if (entries.length === 0) return null;

	return (
		<div
			ref={placeholderRef}
			className={`${styles.wrapper} ${isStuck ? styles.wrapperStuck : ""}`}
		>
			<Collapsible
				open={open}
				onOpenChange={setOpen}
				className={`${styles.popover} ${isStuck ? styles.stuck : ""}`}
			>
				<header
					ref={headerRef}
					className={`${styles.header} ${open ? styles.headerOpen : ""}`}
				>
					<CollapsibleTrigger className={styles.trigger}>
						<ProgressCircle
							value={(selectedIndex + 1) / Math.max(1, allEntries.length)}
							max={1}
							className={`${styles.progressCircle} ${open ? styles.progressCircleOpen : ""}`}
						/>
						<span className={styles.labelWrapper}>
							<span
								className={`${styles.label} ${open ? styles.labelActive : ""} ${showItem || (atIntro && !open) ? styles.labelHidden : ""} ${styles.labelTitle}`}
							>
								Table of Contents
							</span>
							<span
								className={`${styles.label} ${!showItem ? styles.labelHidden : ""} ${styles.labelHeading}`}
							>
								{allEntries[selectedIndex]?.text}
							</span>
							<span
								className={`${styles.label} ${!atIntro || open ? styles.labelHidden : ""} ${styles.labelHeading}`}
							>
								{introLabel}
							</span>
						</span>
						<ChevronDown
							className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
						/>
					</CollapsibleTrigger>
				</header>
				<CollapsibleContent>
					<div className={styles.content}>
						<a
							href="#"
							onClick={(e) => {
								e.preventDefault();
								window.scrollTo({ top: 0, behavior: "smooth" });
								setOpen(false);
							}}
							className={`${styles.tocLink} ${styles.tocLinkIntro} ${atIntro ? styles.tocLinkActive : ""}`}
						>
							{introLabel}
						</a>
						{allEntries.map((entry) => (
							<a
								key={entry.slug}
								href={entry.slug}
								onClick={(e) => {
									e.preventDefault();
									handleLinkClick(entry.slug);
								}}
								className={`${styles.tocLink} ${activeAnchors.includes(entry.slug.slice(1)) ? styles.tocLinkActive : ""}`}
								style={{
									paddingInlineStart: `${entry.level <= 2 ? 0 : (entry.level - 2) * 12}px`,
								}}
							>
								{entry.text}
							</a>
						))}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}

interface ProgressCircleProps extends Omit<ComponentProps<"svg">, "strokeWidth"> {
	value: number;
	strokeWidth?: number;
	size?: number;
	min?: number;
	max?: number;
}

function clamp(input: number, min: number, max: number): number {
	if (input < min) return min;
	if (input > max) return max;
	return input;
}

function ProgressCircle({
	value,
	strokeWidth = 2,
	size = 16,
	min = 0,
	max = 100,
	className,
	...restSvgProps
}: ProgressCircleProps) {
	const normalizedValue = clamp(value, min, max);
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const progress = (normalizedValue / max) * circumference;
	const circleProps = {
		cx: size / 2,
		cy: size / 2,
		r: radius,
		fill: "none" as const,
		strokeWidth,
	};

	return (
		<svg
			role="progressbar"
			viewBox={`0 0 ${size} ${size}`}
			aria-valuenow={normalizedValue}
			aria-valuemin={min}
			aria-valuemax={max}
			className={className}
			width={size}
			height={size}
			{...restSvgProps}
		>
			<circle {...circleProps} stroke="currentColor" opacity={0.25} />
			<circle
				{...circleProps}
				stroke="currentColor"
				strokeDasharray={circumference}
				strokeDashoffset={circumference - progress}
				strokeLinecap="round"
				transform={`rotate(-90 ${size / 2} ${size / 2})`}
				style={{ transition: "all 0.2s ease" }}
			/>
		</svg>
	);
}
