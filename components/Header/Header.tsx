import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import styles from "./Header.module.css";

export default function Header({ children }: { children: React.ReactNode }) {
	return (
		<header className={styles.websitetop}>
			<ThemeToggle />
			<h2 className={styles.brand}>
				<Link href={"/"}>
					Allan Kimmer Jensen
					<span>akj.io</span>
				</Link>
			</h2>
			<section className={styles.header}>{children}</section>
		</header>
	);
}
