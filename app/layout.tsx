import { SpeedInsights } from "@vercel/speed-insights/next";
import { Jersey_25, Inter } from "next/font/google";
import styles from "../styles/Home.module.css";
import "../styles/global-styles.css";
import Navigation from "@/components/Navigation/Navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import OceanWater from "@/components/OceanWater/OceanWater";
import { ThemeProvider } from "@/providers/ThemeProvider";

const font = Jersey_25({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-jersey-25",
	display: "swap",
});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

export const metadata = {
	title: "AKJ.IO",
	description: "Allan Kimmer Jensen",
	alternates: {
		types: {
			"application/rss+xml": "/feed.xml",
		},
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${font.variable} ${inter.variable}`} suppressHydrationWarning>
			<body className={styles.page}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<OceanWater />

					<Header>
						<Navigation />
					</Header>

					<main className={styles.main}>
						<section className={styles.content}>{children}</section>
					</main>

					<Footer />
				</ThemeProvider>
			</body>
			<SpeedInsights />
		</html>
	);
}
