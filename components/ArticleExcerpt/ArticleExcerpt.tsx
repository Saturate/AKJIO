import { format as formatDate } from "date-fns";
import Link from "next/link";
import style from "./ArticleExcerpt.module.css";

export default function ArticleExcerpt({
	link,
	title,
	date,
	subtitle,
	description,
}: {
	link: string;
	title: string;
	date: Date;
	subtitle: string;
	description?: string;
}) {
	return (
		<article
			className="post"
			itemType="http://schema.org/BlogPosting"
			role="article"
		>
			<h1 className={style.heading}>
				<Link href={link}>{title}</Link>
			</h1>
			<time
				className={style.time}
				dateTime="{{ post.data.date | date('Y-m-d') }}"
			>
				{formatDate(date, "do LLLL yyyy")}
			</time>
			<p itemProp="description">
				{description ?? subtitle}
				<a className={style.readMore} href={link}>
					»
				</a>
			</p>
		</article>
	);
}
