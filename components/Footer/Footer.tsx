import styles from "./Footer.module.css";

export default function Footer() {
	return (
		<footer className={styles.footer}>
			<div className={styles.links}>
				<a
					href="https://github.com/Saturate"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="GitHub"
				>
					GitHub
				</a>
				<a
					href="https://www.linkedin.com/in/allankimmerjensen"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="LinkedIn"
				>
					LinkedIn
				</a>
				<a href="/feed.xml" aria-label="RSS Feed">
					RSS
				</a>
			</div>
			<div className={styles.copyright}>
				© 2026 Allan Kimmer Jensen
			</div>
		</footer>
	);
}
