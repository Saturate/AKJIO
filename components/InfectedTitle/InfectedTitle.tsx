import styles from "./InfectedTitle.module.css";

// Each letter is its own span so a colony's tendrils can infect single characters.
// Screen readers get the plain title once through aria-label.
export default function InfectedTitle({ text, className }: { text: string; className?: string }) {
	const words = text.trim().split(/\s+/);
	return (
		<h1 data-infect="" aria-label={text} className={className}>
			{words.map((word, wi) => (
				<span key={wi}>
					{wi > 0 && " "}
					<span className={styles.word} aria-hidden="true">
						{[...word].map((ch, ci) => (
							<span key={ci} className="ch" data-c={ch}>
								{ch}
							</span>
						))}
					</span>
				</span>
			))}
		</h1>
	);
}
