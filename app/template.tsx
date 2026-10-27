import PageWipe from "@/components/PageWipe/PageWipe";
import styles from "./template.module.css";

// Re-mounts on every route change: content rises in, and client navigations get the wipe.
// The inner wrapper takes the rgb-split frame so it doesn't fight the rise-in animation.
export default function Template({ children }: { children: React.ReactNode }) {
	return (
		<>
			<div className={styles.pageEnter}>
				<div id="page-content">{children}</div>
			</div>
			<PageWipe targetId="page-content" />
		</>
	);
}
