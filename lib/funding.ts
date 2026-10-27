// Mirrors GitHub's FUNDING.yml platforms so this stays in sync with the repo's Sponsor button
const PLATFORM_URLS: Record<string, (handle: string) => string> = {
	github: (h) => `https://github.com/sponsors/${h}`,
	patreon: (h) => `https://www.patreon.com/${h}`,
	open_collective: (h) => `https://opencollective.com/${h}`,
	ko_fi: (h) => `https://ko-fi.com/${h}`,
	tidelift: (h) => `https://tidelift.com/funding/github/${h}`,
	community_bridge: (h) => `https://funding.communitybridge.org/projects/${h}`,
	liberapay: (h) => `https://liberapay.com/${h}`,
	issuehunt: (h) => `https://issuehunt.io/r/${h}`,
	lfx_crowdfunding: (h) =>
		`https://crowdfunding.lfx.linuxfoundation.org/projects/${h}`,
	polar: (h) => `https://polar.sh/${h}`,
	buy_me_a_coffee: (h) => `https://buymeacoffee.com/${h}`,
	thanks_dev: (h) => `https://thanks.dev/${h}`,
	custom: (url) => url,
};

export type FundingLink = { platform: string; url: string };

// Flow lists and scalars only; GitHub's block-list form isn't used in this repo
function parseValues(raw: string): string[] {
	const value = raw.replace(/\s+#.*$/, "").trim();
	if (!value || value.startsWith("#")) return [];

	const list = value.startsWith("[") ? value.slice(1, -1).split(",") : [value];
	return list.map((v) => v.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
}

export function parseFundingYml(content: string): FundingLink[] {
	return content.split("\n").flatMap((line) => {
		const match = line.match(/^(\w+):(.*)$/);
		const toUrl = match && PLATFORM_URLS[match[1]];
		if (!match || !toUrl) return [];

		return parseValues(match[2]).map((handle) => ({
			platform: match[1],
			url: toUrl(handle),
		}));
	});
}
