"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { create, insertMultiple, search as oramaSearch } from "@orama/orama";
import { Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import styles from "./Search.module.css";
import type { SearchDocument } from "@/lib/search/extract";

function snippet(content: string, query: string, maxLen = 150): string {
	const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
	const lower = content.toLowerCase();
	let pos = content.length;
	for (const term of terms) {
		const idx = lower.indexOf(term);
		if (idx !== -1 && idx < pos) pos = idx;
	}
	if (content.length <= maxLen) return content;
	const start = Math.max(0, Math.min(pos - Math.floor(maxLen / 2), content.length - maxLen));
	const end = start + maxLen;
	return (start > 0 ? "…" : "") + content.slice(start, end) + (end < content.length ? "…" : "");
}

function highlight(text: string, query: string): React.ReactNode[] {
	const terms = query.split(/\s+/).filter(Boolean);
	if (!terms.length) return [text];
	const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
	const regex = new RegExp(`(${escaped})`, "gi");
	const parts: React.ReactNode[] = [];
	let last = 0;
	for (const match of text.matchAll(regex)) {
		if (match.index > last) parts.push(text.slice(last, match.index));
		parts.push(<mark key={match.index} className={styles.mark}>{match[0]}</mark>);
		last = match.index + match[0].length;
	}
	if (last < text.length) parts.push(text.slice(last));
	return parts.length ? parts : [text];
}

const schema = {
	id: "string",
	url: "string",
	page_url: "string",
	page_title: "string",
	type: "string",
	content: "string",
} as const;

type OramaDB = Awaited<ReturnType<typeof create<typeof schema>>>;

interface SearchGroup {
	pageUrl: string;
	pageTitle: string;
	hits: SearchDocument[];
}

function groupResults(hits: SearchDocument[]): SearchGroup[] {
	const map = new Map<string, SearchGroup>();

	for (const doc of hits) {
		if (!map.has(doc.page_url)) {
			map.set(doc.page_url, { pageUrl: doc.page_url, pageTitle: doc.page_title, hits: [] });
		}
		// page-level hit is the group header, not a sub-result
		if (doc.type !== "page") {
			map.get(doc.page_url)!.hits.push(doc);
		}
	}

	return Array.from(map.values()).filter(
		(g) => g.hits.length > 0 || hits.some((h) => h.page_url === g.pageUrl && h.type === "page"),
	);
}

export default function Search() {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [groups, setGroups] = useState<SearchGroup[]>([]);
	const [db, setDb] = useState<OramaDB | null>(null);
	const [loading, setLoading] = useState(false);
	const isMac =
		typeof navigator !== "undefined" ? navigator.platform.includes("Mac") : true;

	const openDialog = useCallback(async () => {
		dialogRef.current?.showModal();
		inputRef.current?.focus();

		if (db) return;

		setLoading(true);
		try {
			const documents: SearchDocument[] = await fetch("/api/search").then((r) => r.json());
			const newDb = await create({ schema });
			await insertMultiple(newDb, documents as never);
			setDb(newDb);
		} finally {
			setLoading(false);
		}
	}, [db]);

	const closeDialog = useCallback(() => {
		dialogRef.current?.close();
		setQuery("");
		setGroups([]);
	}, []);

	// Cmd+K / Ctrl+K shortcut
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				openDialog();
			}
			if (e.key === "Escape") closeDialog();
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [openDialog, closeDialog]);

	// Run search whenever query or db changes
	useEffect(() => {
		if (!db || query.trim().length < 2) {
			setGroups([]);
			return;
		}

		Promise.resolve(
			oramaSearch(db, {
				term: query,
				properties: ["content", "page_title"],
				limit: 30,
			}),
		).then((result) => {
			const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
			const docs = result.hits
				.map((h) => h.document as unknown as SearchDocument)
				// Only show a sub-hit if its own content matches — prevents every chunk
				// from a page appearing when only the page title matched the query.
				.filter((doc) => doc.type === "page" || terms.some((t) => doc.content.toLowerCase().includes(t)));
			setGroups(groupResults(docs));
		});
	}, [query, db]);

	return (
		<>
			<button className={styles.trigger} onClick={openDialog} aria-label="Open search">
				Search
				<kbd>{isMac ? "⌘K" : "Ctrl+K"}</kbd>
			</button>

			<dialog ref={dialogRef} className={styles.dialog} onClick={(e) => {
				// close on backdrop click
				if (e.target === dialogRef.current) closeDialog();
			}}>
				<div className={styles.panel}>
					<div className={styles.inputRow}>
						<SearchIcon size={16} className={styles.inputIcon} />
						<input
							ref={inputRef}
							className={styles.input}
							placeholder="Search posts and pages…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							autoComplete="off"
							spellCheck={false}
						/>
						<button className={styles.closeBtn} onClick={closeDialog} aria-label="Close">
							Esc
						</button>
					</div>

					<div className={styles.results}>
						{loading && <p className={styles.hint}>Loading index…</p>}

						{!loading && query.trim().length >= 2 && groups.length === 0 && (
							<p className={styles.hint}>No results for &ldquo;{query}&rdquo;</p>
						)}

						{!loading && query.trim().length < 2 && !groups.length && (
							<p className={styles.hint}>Type at least 2 characters to search</p>
						)}

						{groups.map((group) => (
							<div key={group.pageUrl} className={styles.group}>
								<Link href={group.pageUrl} className={styles.groupTitle} onClick={closeDialog}>
									{group.pageTitle}
								</Link>
								{group.hits.slice(0, 4).map((hit) => (
									<Link
										key={hit.id}
										href={hit.url}
										className={styles.hit}
										onClick={closeDialog}
									>
										{hit.type === "heading" && (
											<span className={styles.hitType}>§</span>
										)}
										<span className={styles.hitContent}>
										{highlight(snippet(hit.content, query), query)}
									</span>
									</Link>
								))}
							</div>
						))}
					</div>
				</div>
			</dialog>
		</>
	);
}
