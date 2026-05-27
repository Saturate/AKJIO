import { serializeJsonLd } from "@/utils/generateJsonLd";

export default function JsonLd({ data, nonce }: { data: Record<string, unknown>; nonce?: string }) {
	return (
		<script
			type="application/ld+json"
			nonce={nonce}
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
		/>
	);
}
