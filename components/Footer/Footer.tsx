import { GithubLogo, LinkedinLogo, RssSimple } from "@phosphor-icons/react/dist/ssr";
import styles from "./Footer.module.css";

export default function Footer() {
	return (
		<footer className={styles.footer}>
			<div className={styles.copyright}>
				© 1990-present Allan Kimmer Jensen. All Rights Reserved.
			</div>
			<div className={styles.links}>
				<a
					href="https://github.com/Saturate"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="GitHub"
				>
					<GithubLogo weight="fill" />
				</a>
				<a
					href="https://www.linkedin.com/in/allankimmerjensen"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="LinkedIn"
				>
					<LinkedinLogo weight="fill" />
				</a>
				<a href="/feed.xml" aria-label="RSS Feed">
					<RssSimple weight="fill" />
				</a>
			</div>
		</footer>
	);
}
