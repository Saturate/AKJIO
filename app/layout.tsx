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
	metadataBase: new URL("https://akj.io"),
	title: {
		default: "AKJ.IO - Allan Kimmer Jensen",
		template: "%s | AKJ.IO",
	},
	description:
		"Software engineer and security enthusiast. Writing about CTF challenges, web security, frontend development, and software architecture.",
	keywords: [
		"security",
		"CTF",
		"web development",
		"software engineering",
		"Allan Kimmer Jensen",
	],
	authors: [{ name: "Allan Kimmer Jensen", url: "https://akj.io" }],
	creator: "Allan Kimmer Jensen",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://akj.io",
		siteName: "AKJ.IO",
		title: "AKJ.IO - Allan Kimmer Jensen",
		description:
			"Software engineer and security enthusiast. Writing about CTF challenges, web security, frontend development, and software architecture.",
	},
	twitter: {
		card: "summary_large_image",
		title: "AKJ.IO - Allan Kimmer Jensen",
		description:
			"Software engineer and security enthusiast. Writing about CTF challenges, web security, and software architecture.",
		creator: "@allankimmer",
	},
	alternates: {
		types: {
			"application/rss+xml": "https://akj.io/feed",
		},
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
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
