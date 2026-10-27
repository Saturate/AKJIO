import Link from "next/link";
import { Suspense } from "react";
import Colony from "@/components/Colony/Colony";
import FieldStation from "@/components/FieldStation/FieldStation";
import FieldStationView from "@/components/FieldStation/FieldStationView";
import Wordmark from "./Wordmark";
import FooterPath from "./FooterPath";
import styles from "./Footer.module.css";

const TOP_CORNERS = [0, 1] as const;
const TOP_EDGE = [0] as const;

const WRITING = [
	{ href: "/posts", label: "Posts" },
	{ href: "/about", label: "About" },
	{ href: "/work", label: "Work" },
	{ href: "/cv", label: "CV" },
];

const ELSEWHERE = [
	{ href: "https://github.com/Saturate", label: "GitHub", external: true },
	{
		href: "https://www.linkedin.com/in/allankimmerjensen",
		label: "LinkedIn",
		external: true,
	},
	{ href: "/feed", label: "RSS", external: false },
	{ href: "/llms.txt", label: "llms.txt", external: false },
];

export default function Footer() {
	return (
		<Colony
			as="footer"
			seed={4242}
			inward={0.35}
			reach={30}
			corners={TOP_CORNERS}
			edges={TOP_EDGE}
			className={styles.footer}
		>
			<div className={styles.grid}>
				<Wordmark />
				<nav className={styles.col} aria-label="Writing">
					<h2 className={styles.label}>Writing</h2>
					{WRITING.map((l) => (
						<Link
							key={l.href}
							href={l.href}
							className={`${styles.link} grow-underline`}
						>
							{l.label}
						</Link>
					))}
				</nav>
				<nav className={styles.col} aria-label="Elsewhere">
					<h2 className={styles.label}>Elsewhere</h2>
					{ELSEWHERE.map((l) =>
						l.external ? (
							<a
								key={l.href}
								href={l.href}
								className={`${styles.link} grow-underline`}
								target="_blank"
								rel="noopener noreferrer"
							>
								{l.label}
							</a>
						) : (
							<a
								key={l.href}
								href={l.href}
								className={`${styles.link} grow-underline`}
							>
								{l.label}
							</a>
						),
					)}
				</nav>
				<div className={styles.slot}>
					<Suspense fallback={<FieldStationView data={null} />}>
						<FieldStation />
					</Suspense>
				</div>
			</div>
			<div className={styles.bottom}>
				<FooterPath />
				<Link href="/privacy" className="grow-underline">
					No trackers. A cookie only if you change the settings.
				</Link>
			</div>
		</Colony>
	);
}
