import { Fraunces, Geist, Geist_Mono, Silkscreen } from "next/font/google";
import styles from "../styles/Home.module.css";
import "../styles/global-styles.css";
import "../styles/syntaxhighlighting.css";
import "../styles/prose.css";
import Navigation from "@/components/Navigation/Navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SporeField from "@/components/SporeField/SporeField";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { getNonce } from "@/utils/nonce";
import { strainCss } from "@/lib/strains";
import { SETTINGS_COOKIE, parseSettings } from "@/lib/settings";
import { cookies } from "next/headers";
import CulturePanel from "@/components/CulturePanel/CulturePanel";
import ImageViewer from "@/components/ImageViewer/ImageViewer";
import WebMCP from "@/components/WebMCP/WebMCP";

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
	weight: "700",
	variable: "--font-silkscreen",
	display: "swap",
});

const fontVars = [fraunces, geist, geistMono, silkscreen]
	.map((f) => f.variable)
	.join(" ");

// Strain and an explicit mode are rendered on the server from the settings cookie. Only "system"
// needs the browser, so this resolves it before paint to avoid a flash.
const prePaint = `(function(){try{var d=document.documentElement;if(d.dataset.theme!=="system")return;var r=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";d.classList.add(r);d.style.colorScheme=r}catch(e){}})()`;

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
	const settings = parseSettings((await cookies()).get(SETTINGS_COOKIE)?.value);
	const modeClass = settings.theme === "system" ? "" : ` ${settings.theme}`;

	return (
		<html
			lang="en"
			className={fontVars + modeClass}
			data-strain={settings.strain}
			data-theme={settings.theme}
			style={
				settings.theme === "system"
					? undefined
					: { colorScheme: settings.theme }
			}
			suppressHydrationWarning
		>
			<head>
				<script nonce={nonce} dangerouslySetInnerHTML={{ __html: prePaint }} />
				<style dangerouslySetInnerHTML={{ __html: strainCss() }} />
			</head>
			<body className={styles.page}>
				<ThemeProvider initial={settings}>
					<SporeField />
					<ImageViewer />
					<Header>
						<Navigation />
					</Header>

					<main className={styles.main}>
						<section className={styles.content}>{children}</section>
					</main>

					<Footer />
					<WebMCP />
					{/* After the footer so it is the last tab stop, not the first; it's fixed, so position doesn't change. */}
					<CulturePanel />
				</ThemeProvider>
			</body>
		</html>
	);
}
