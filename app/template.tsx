import styles from "./template.module.css";

// Re-mounts on every route change: gives page content a gentle rise-in
// instead of an instant swap.
export default function Template({ children }: { children: React.ReactNode }) {
	return <div className={styles.pageEnter}>{children}</div>;
}
