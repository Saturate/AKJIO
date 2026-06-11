import { Jersey_25, Inter } from "next/font/google";
import styles from "../styles/Home.module.css";
import "../styles/global-styles.css";
import "../styles/syntaxhighlighting.css";
import Navigation from "@/components/Navigation/Navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Ocean3DLazy from "@/components/Ocean3D/Ocean3DLazy";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { getNonce } from "@/utils/nonce";

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
		<html lang="en" className={`${font.variable} ${inter.variable}`} suppressHydrationWarning>
			<head>
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme")||"system";var r=t;if(t==="system")r=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";document.documentElement.classList.add(r);document.documentElement.style.colorScheme=r}catch(e){}})()` }}
				/>
			</head>
			<body className={styles.page}>
				<ThemeProvider>
					<Ocean3DLazy />

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
