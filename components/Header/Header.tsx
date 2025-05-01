import Link from "next/link";
import styles from "./Header.module.css";

export default function Header({ children }: { children: React.ReactNode }) {
	return (
		<header className={styles.websitetop}>
			<section className={styles.header}>
				<h2 className={styles.headerTitle}>
					<Link href={"/"}>AKJ.IO</Link>
					<span>Allan Kimmer Jensen</span>
				</h2>
				{children}
			</section>
			<div className={styles.waterline}></div>
		</header>
	);
}
