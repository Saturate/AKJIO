import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.scss";

export default function Home() {
	console.log(styles);
	return (
		<div className={styles.page}>
			<Head>
				<title>AKJ</title>
				<meta name="description" content="Allan Kimmer Jensen" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<header className={styles.websitetop}>
				<section className={styles.content}>
					<h2 className={styles.headerTitle}>
						<Link href={"/"}>AKJ</Link>
					</h2>
					<nav className={styles.nav}>
						<Link href={"/words"}>
							Words <span>Solutions, </span>
						</Link>
						<Link href={"/about"}>
							About Me <span></span>
						</Link>
					</nav>
				</section>
				<div className={styles.waterline}>
					<svg
						viewBox="0 0 210 297"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g>
							<path
								fill="#1633da"
								d="m -2.0243422,53.408478 c -23.1586698,-26.02647 -9.2907388,-36.93296 -9.2907388,-36.93296 0,0 18.5654646,-2.58067 32.84113,-6.46452 12.023798,-3.2712098 30.870422,4.94737 37.339912,6.94933 12.93898,4.00392 26.12103,4.01441 42.651849,1.68374 16.53082,-2.33066 34.98827,-0.91898 44.96538,-1.78655 9.97712,-0.86758 37.01034,1.21486 52.51845,-0.33599 15.29525,-1.52957 15.62498,-0.0368 15.62498,-0.0368 0,0 3.38886,12.78044 -1.78144,36.72657"
							/>
						</g>
					</svg>
				</div>
			</header>

			<main className={styles.main}>
				<section className={styles.content}>
					<h1>Hi! 👋</h1>
					<p>
						I'm Allan. A passionate frontend
						developer/engineer/developer/lover,{" "}
					</p>
					<p>Performance, animations, dev tooling</p>

					<h3>More?</h3>
					<p>Read the about me page...</p>

					<h3>Words?</h3>
					<p>"blog" posts</p>
				</section>
			</main>

			<footer className={styles.footer}>
				Copyright 2022 - Allan Kimmer Jensen
			</footer>
		</div>
	);
}
