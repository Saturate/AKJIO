"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./ImageViewer.module.css";

const SELECTOR = ".prose img";

// One viewer for every image in long-form text. Delegated, so it also covers images written as raw
// JSX in MDX. Images get focus and Enter/Space so the viewer works without a mouse; the native
// <dialog> handles Esc, focus trapping and returning focus to the image.
export default function ImageViewer() {
	const dialog = useRef<HTMLDialogElement>(null);
	const [image, setImage] = useState<{ src: string; alt: string } | null>(null);
	const pathname = usePathname();

	useEffect(() => {
		const enhance = () => {
			for (const img of document.querySelectorAll<HTMLImageElement>(SELECTOR)) {
				if (img.dataset.zoomable) continue;
				img.dataset.zoomable = "";
				img.tabIndex = 0;
				img.setAttribute("role", "button");
				img.setAttribute(
					"aria-label",
					img.alt ? `Enlarge image: ${img.alt}` : "Enlarge image",
				);
			}
		};
		enhance();
		const root = document.getElementById("page-content");
		const mo = root ? new MutationObserver(enhance) : null;
		if (root && mo) mo.observe(root, { childList: true, subtree: true });
		return () => mo?.disconnect();
	}, [pathname]);

	useEffect(() => {
		const open = (target: EventTarget | null) => {
			if (!(target instanceof HTMLImageElement) || !target.matches(SELECTOR))
				return false;
			// src, not currentSrc: for next/image it is the largest candidate, which is what a viewer wants.
			setImage({ src: target.src, alt: target.alt });
			dialog.current?.showModal();
			return true;
		};
		const onClick = (e: MouseEvent) => {
			open(e.target);
		};
		const onKey = (e: KeyboardEvent) => {
			if ((e.key === "Enter" || e.key === " ") && open(e.target))
				e.preventDefault();
		};
		document.addEventListener("click", onClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("click", onClick);
			document.removeEventListener("keydown", onKey);
		};
	}, []);

	return (
		<dialog
			ref={dialog}
			className={styles.viewer}
			aria-label={image?.alt || "Image"}
			onClick={(e) => {
				if (e.target === e.currentTarget) dialog.current?.close();
			}}
			onClose={() => setImage(null)}
		>
			<button
				type="button"
				className={styles.close}
				onClick={() => dialog.current?.close()}
				aria-label="Close image"
			>
				×
			</button>
			{image && (
				<>
					{/* eslint-disable-next-line @next/next/no-img-element -- shows the original file at full size */}
					<img src={image.src} alt={image.alt} className={styles.full} />
					{image.alt && <span className={styles.caption}>{image.alt}</span>}
				</>
			)}
		</dialog>
	);
}
