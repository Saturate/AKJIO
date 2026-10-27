import "react";

// Lets inline styles set CSS custom properties without casting.
declare module "react" {
	interface CSSProperties {
		[key: `--${string}`]: string | number | undefined;
	}
}
