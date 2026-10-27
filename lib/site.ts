// Preview deployments can point this at themselves; production falls back to the real domain
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://akj.io";
