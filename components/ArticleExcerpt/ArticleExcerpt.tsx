import { format as formatDate } from "date-fns";
import Link from "next/link";
import style from "./ArticleExcerpt.module.css";

export default function ArticleExcerpt({
	link,
	title,
	date,
	subtitle,
	description,
	readTime,
}: {
	link: string;
	title: string;
	date: Date;
	subtitle: string;
	description?: string;
	readTime?: number;
}) {
	return (
		<article className="post" role="article">
			<h1 className={style.heading}>
				<Link href={link}>{title}</Link>
			</h1>
			<div className={style.meta}>
				<time dateTime={new Date(date).toISOString()}>
					{formatDate(date, "do LLLL yyyy")}
				</time>
				{readTime && <span className={style.readTime}>{readTime} min read</span>}
			</div>
			<p>
				{description ?? subtitle}
				<a className={style.readMore} href={link}>
					»
				</a>
			</p>
		</article>
	);
}
