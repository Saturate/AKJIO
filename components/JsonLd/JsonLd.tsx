import Script from "next/script";
import { serializeJsonLd } from "@/utils/generateJsonLd";

export default function JsonLd({ data, nonce }: { data: Record<string, unknown>; nonce?: string }) {
	return (
		<Script
			id="json-ld"
			type="application/ld+json"
			nonce={nonce}
			strategy="afterInteractive"
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
		/>
	);
}
