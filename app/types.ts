export type PageProps = Readonly<{
	params: Promise<{ slug: string; lang: string }>;
	searchParams: Promise<{ [key: string]: string }>;
}>;
