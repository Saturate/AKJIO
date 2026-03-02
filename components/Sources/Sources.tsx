"use client";

import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from "@/components/Collapsible/Collapsible";
import styles from "./Sources.module.css";

interface SourcesProps {
	sources: Array<{ title: string; url: string }>;
}

export default function Sources({ sources }: SourcesProps) {
	return (
		<Collapsible className={styles.sources}>
			<CollapsibleTrigger className={styles.trigger}>
				Sources ({sources.length})
				<svg
					className={styles.chevron}
					width="12"
					height="12"
					viewBox="0 0 16 16"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M4 6l4 4 4-4"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<ul className={styles.list}>
					{sources.map((source) => (
						<li key={source.url}>
							<a
								href={source.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								{source.title}
							</a>
						</li>
					))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}
