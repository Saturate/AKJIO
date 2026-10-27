"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { scramble } from "@/lib/motion";
import styles from "./Navigation.module.css";

const ITEMS = [
	{ href: "/posts", label: "Posts" },
	{ href: "/about", label: "About" },
	{ href: "/work", label: "Work" },
];

export default function Navigation() {
	const pathname = usePathname();

	return (
		<nav className={styles.nav} aria-label="Main">
			{ITEMS.map((item, i) => {
				const current =
					pathname === item.href || pathname.startsWith(item.href + "/");
				const run = (e: React.SyntheticEvent<HTMLAnchorElement>) => {
					const label =
						e.currentTarget.querySelector<HTMLElement>("[data-label]");
					if (label) scramble(label, item.label);
				};
				return (
					<Link
						key={item.href}
						href={item.href}
						className={`${styles.link} grow-underline`}
						aria-current={current ? "page" : undefined}
						// The visible label scrambles on focus; screen readers get the stable name.
						aria-label={item.label}
						onPointerEnter={run}
						onFocus={run}
					>
						<span className={styles.index} aria-hidden="true">
							{String(i + 1).padStart(2, "0")}
						</span>
						<span data-label>{item.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
