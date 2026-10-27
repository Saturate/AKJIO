import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import ScrollProgress from "@/components/ScrollProgress/ScrollProgress";
import styles from "./Header.module.css";

export default function Header({ children }: { children: React.ReactNode }) {
	return (
		<header className={styles.top} data-site-header="">
			<Link href="/" className={styles.mark} aria-label="akj.io, home">
				akj.io
			</Link>
			{children}
			<ThemeToggle />
			<ScrollProgress />
		</header>
	);
}
