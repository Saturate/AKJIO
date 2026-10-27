import fs from "fs";
import path from "path";
import { parseFundingYml } from "@/lib/funding";

// .github isn't traced into the serverless bundle, so read it once at build time
export const dynamic = "force-static";

const PITCH =
	"I write everything on akj.io in my spare time. No ads, no paywall, no newsletter popup. " +
	"If a post saved you an afternoon of debugging or got you a flag, you can buy me a coffee here:";

export async function GET() {
	const content = fs.readFileSync(
		path.join(process.cwd(), ".github", "FUNDING.yml"),
		"utf8",
	);

	const links = parseFundingYml(content).map(
		({ platform, url }) => `- ${platform}: ${url}`,
	);

	return new Response([PITCH, "", ...links, ""].join("\n"), {
		headers: { "Content-Type": "text/markdown; charset=utf-8" },
	});
}
