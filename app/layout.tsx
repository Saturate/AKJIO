import { Fraunces, Geist, Geist_Mono, Silkscreen } from "next/font/google";
import styles from "../styles/Home.module.css";
import "../styles/global-styles.css";
import "../styles/syntaxhighlighting.css";
import Navigation from "@/components/Navigation/Navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { getNonce } from "@/utils/nonce";
import { DEFAULT_STRAIN, STRAIN_KEYS, strainCss } from "@/lib/strains";

const fraunces = Fraunces({
	subsets: ["latin"],
	axes: ["SOFT", "WONK", "opsz"],
	style: ["normal", "italic"],
	variable: "--font-fraunces",
	display: "swap",
});

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist",
	display: "swap",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
	display: "swap",
});

const silkscreen = Silkscreen({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-silkscreen",
	display: "swap",
});

const fontVars = [fraunces, geist, geistMono, silkscreen].map((f) => f.variable).join(" ");

// Runs before paint so the stored mode and strain apply without a flash.
const prePaint = `(function(){try{var t=localStorage.getItem("theme")||"system";var r=t;if(t==="system")r=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";var d=document.documentElement;d.classList.add(r);d.style.colorScheme=r;var s=localStorage.getItem("strain");d.dataset.strain=${JSON.stringify(STRAIN_KEYS)}.indexOf(s)>-1?s:${JSON.stringify(DEFAULT_STRAIN)}}catch(e){}})()`;

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
			"text/markdown": "https://akj.io/llms.txt",
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

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const nonce = await getNonce();

	return (
		<html lang="en" className={fontVars} data-strain={DEFAULT_STRAIN} suppressHydrationWarning>
			<head>
				<script nonce={nonce} dangerouslySetInnerHTML={{ __html: prePaint }} />
				<style dangerouslySetInnerHTML={{ __html: strainCss() }} />
			</head>
			<body className={styles.page}>
				<ThemeProvider>
					<Header>
						<Navigation />
					</Header>

					<main className={styles.main}>
						<section className={styles.content}>{children}</section>
					</main>

					<Footer />
				</ThemeProvider>
			</body>
		</html>
	);
}
