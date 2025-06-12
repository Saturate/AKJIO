import { LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr/LinkedinLogo";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/ssr/GithubLogo";

import styles from "./Footer.module.css";
import Link from "next/link";

export default function Footer() {
	return (
		<footer className={styles.footer}>
			<div className={styles.content}>
				<p className={styles.copyright}>
					© 1990-present Allan Kimmer Jensen. All Rights Reserved.
				</p>
				<p className={styles.socials}>
					<Link
						className={styles.socialLink}
						href={"https://www.linkedin.com/in/allankimmerjensen/"}
						target="_blank"
						rel="noreferrer"
						aria-label={"Linkedin"}
					>
						<LinkedinLogoIcon />
					</Link>
					<Link
						className={styles.socialLink}
						href={"https://github.com/Saturate"}
						target="_blank"
						rel="noreferrer"
						aria-label={"Github"}
					>
						<GithubLogoIcon />
					</Link>
				</p>
			</div>
		</footer>
	);
}
