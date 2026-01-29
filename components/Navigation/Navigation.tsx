import Link from "next/link";
import styles from "./Navigation.module.css";

export default function Navigation() {
	return (
		<nav className={styles.nav}>
			<Link href={"/posts"}>
				Posts <span>Writing & Security</span>
			</Link>
			<Link href={"/about"}>
				About <span>Background & Experience</span>
			</Link>
			<Link href={"/work"}>
				Work <span>Projects & Domains</span>
			</Link>
		</nav>
	);
}
