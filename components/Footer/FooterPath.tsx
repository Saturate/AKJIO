"use client";

import { usePathname } from "next/navigation";

export default function FooterPath() {
	const pathname = usePathname();
	return <span>~/akj.io{pathname === "/" ? "" : pathname}</span>;
}
