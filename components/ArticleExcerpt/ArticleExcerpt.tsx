import { format as formatDate } from "date-fns";
import Link from "next/link";

export default function ArticleExcerpt({
	link,
	title,
	date,
	subtitle,
}: {
	link: string;
	title: string;
	date: Date;
	subtitle: string;
}) {
	return (
		<article
			className="post"
			itemType="http://schema.org/BlogPosting"
			role="article"
		>
			<h1>
				<Link href={link}>{title}</Link>
			</h1>
			<time dateTime="{{ post.data.date | date('Y-m-d') }}">
				{formatDate(date, "do LLLL yyyy")}
			</time>
			<p itemProp="description">
				{subtitle}
				<a className="read-more" href={link}>
					»
				</a>
			</p>
		</article>
	);
}
