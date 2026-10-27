import { STATION } from "@/lib/station";

// Fetched on the server so visitors never contact these services (and CSP stays 'self').
const REVALIDATE = 1800;
// Failed fetches aren't cached, so remember a dead relay ourselves instead of waiting on it every render.
const RELAY_RETRY_MS = 10 * 60 * 1000;
let relayDownUntil = 0;

export type StationData = {
	air: { temp: number; rh: number } | null;
	wind: { speed: number; dir: number } | null;
	sky: { cloud: number; pressure: number } | null;
	sun: { rise: string; set: string } | null;
	daylight: { seconds: number; delta: number } | null;
	kp: number | null;
	pollen: { items: string[]; aqi: number | null; source: string } | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown): number | null {
	return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function numArray(v: unknown): number[] | null {
	return Array.isArray(v) && v.every((x) => typeof x === "number") ? v : null;
}

function strArray(v: unknown): string[] | null {
	return Array.isArray(v) && v.every((x) => typeof x === "string") ? v : null;
}

async function getJson(url: string, timeoutMs: number): Promise<unknown> {
	try {
		const res = await fetch(url, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(timeoutMs) });
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

async function weather(): Promise<Pick<StationData, "air" | "wind" | "sky" | "sun" | "daylight">> {
	const url =
		`https://api.open-meteo.com/v1/forecast?latitude=${STATION.lat}&longitude=${STATION.lon}` +
		"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,cloud_cover,surface_pressure" +
		"&daily=sunrise,sunset,daylight_duration&wind_speed_unit=ms&timezone=Europe%2FCopenhagen&past_days=1&forecast_days=1";
	const data = await getJson(url, 4000);
	const empty = { air: null, wind: null, sky: null, sun: null, daylight: null };
	if (!isRecord(data) || !isRecord(data.current) || !isRecord(data.daily)) return empty;
	const c = data.current;
	const d = data.daily;
	const temp = num(c.temperature_2m);
	const rh = num(c.relative_humidity_2m);
	const speed = num(c.wind_speed_10m);
	const dir = num(c.wind_direction_10m);
	const cloud = num(c.cloud_cover);
	const pressure = num(c.surface_pressure);
	const rises = strArray(d.sunrise);
	const sets = strArray(d.sunset);
	const daylight = numArray(d.daylight_duration);
	const today = daylight ? daylight.length - 1 : -1;
	return {
		air: temp !== null && rh !== null ? { temp, rh } : null,
		wind: speed !== null && dir !== null ? { speed, dir } : null,
		sky: cloud !== null && pressure !== null ? { cloud, pressure } : null,
		sun: rises && sets && rises[today] && sets[today] ? { rise: rises[today].slice(11, 16), set: sets[today].slice(11, 16) } : null,
		daylight: daylight && today > 0 ? { seconds: daylight[today], delta: daylight[today] - daylight[today - 1] } : null,
	};
}

async function aurora(): Promise<number | null> {
	const rows = await getJson("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", 4000);
	if (!Array.isArray(rows) || !rows.length) return null;
	const last: unknown = rows[rows.length - 1];
	// NOAA has shipped both an array-of-arrays and an array-of-objects shape for this product.
	if (Array.isArray(last)) return num(Number(last[1]));
	if (isRecord(last)) return num(Number(last.Kp));
	return null;
}

const POLLEN_KINDS = ["alder", "birch", "grass", "mugwort", "ragweed"] as const;

function pollenLevel(v: number): string {
	if (v < 10) return "low";
	if (v < 50) return "moderate";
	return "high";
}

async function pollen(): Promise<StationData["pollen"]> {
	// Own relay first; it is Denmark-specific but currently unreliable, so keep its timeout short.
	if (Date.now() > relayDownUntil) {
		const own = await getJson("https://pollen.akj.io/v1/dk/copenhagen/forecast?lang=en", 2500);
		const items = Array.isArray(own)
			? own
					.filter(isRecord)
					.slice(0, 4)
					.map((x) => `${String(x.name ?? x.type ?? "")} ${String(x.level ?? x.value ?? "")}`.trim())
					.filter(Boolean)
			: [];
		if (items.length) return { items, aqi: null, source: "pollen.akj.io" };
		relayDownUntil = Date.now() + RELAY_RETRY_MS;
	}
	const aq = await getJson(
		`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${STATION.lat}&longitude=${STATION.lon}` +
			"&current=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen,european_aqi&timezone=Europe%2FCopenhagen",
		4000,
	);
	if (!isRecord(aq) || !isRecord(aq.current)) return null;
	const cur = aq.current;
	const items = POLLEN_KINDS.flatMap((k) => {
		const v = num(cur[`${k}_pollen`]);
		return v !== null && v > 0.5 ? [`${k} ${pollenLevel(v)}`] : [];
	});
	return { items, aqi: num(cur.european_aqi), source: "open-meteo" };
}

export async function getStationData(): Promise<StationData> {
	const [w, kp, p] = await Promise.all([weather(), aurora(), pollen()]);
	return { ...w, kp, pollen: p };
}
