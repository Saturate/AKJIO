import Link from "next/link";
import styles from "./Navigation.module.css";

export default function Navigation() {
	return (
		<nav className={styles.nav}>
			<Link href={"/posts"}>
				Posts <span>Solutions, Words, toughts</span>
			</Link>
			<Link href={"/about"}>
				About <span>Stats, Level and Skills!</span>
			</Link>
			<Link href={"/labs"}>
				Labs
				<span>Insane Experiments, fun code, hacks</span>
			</Link>
		</nav>
	);
}
