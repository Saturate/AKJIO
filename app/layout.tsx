import { SpeedInsights } from "@vercel/speed-insights/next";
import { Jersey_25 } from "next/font/google";
import styles from "../styles/Home.module.scss";
import "../styles/global-styles.scss";
import Navigation from "@/components/Navigation/Navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

const font = Jersey_25({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-jersey-25",
	display: "swap",
});

export const metadata = {
	title: "AKJ.IO",
	description: "Allan Kimmer Jensen",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={font.variable}>
			<body className={styles.page}>
				<Header>
					<Navigation />
				</Header>

				<main className={styles.main}>
					<section className={styles.content}>{children}</section>
				</main>

				<Footer />
			</body>
			<SpeedInsights />
		</html>
	);
}
