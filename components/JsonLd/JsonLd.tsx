import { serializeJsonLd } from "@/utils/generateJsonLd";

// A plain server-rendered tag, not next/script: crawlers that don't run JS (most AI bots)
// never saw the client-injected version. JSON-LD isn't executed, so it needs no nonce.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
		/>
	);
}
