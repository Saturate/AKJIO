"use client";

import { usePathname } from "next/navigation";

// not-found.tsx gets no params, so the missed path only exists on the client router
export default function MissingPath({ className }: { className?: string }) {
	return <code className={className}>{usePathname()}</code>;
}
