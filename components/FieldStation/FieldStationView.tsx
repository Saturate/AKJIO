"use client";

import { useEffect, useState } from "react";
import type { StationData } from "@/lib/fieldStation";
import { getIlluminationFraction, getMoonPhase } from "@/lib/moonPhase";
import { STATION } from "@/lib/station";
import MoonCanvas from "./MoonCanvas";
import styles from "./FieldStation.module.css";

const { lat: LAT, lon: LON, tz: TZ } = STATION;
const PHASES = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

// Low-precision solar position (about 1°): enough for "how high is the sun right now".
function sunAltitude(date: Date): number {
	const rad = Math.PI / 180;
	const d = date.getTime() / 864e5 - 10957.5;
	const g = (357.529 + 0.98560028 * d) * rad;
	const q = 280.459 + 0.98564736 * d;
	const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
	const e = (23.439 - 0.00000036 * d) * rad;
	const dec = Math.asin(Math.sin(e) * Math.sin(L));
	const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
	const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
	const h = (gmst * 15 + LON) * rad - ra;
	const lat = LAT * rad;
	return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(h)) / rad;
}

function Stat({ label, value, note, wide }: { label: string; value: React.ReactNode; note?: string; wide?: boolean }) {
	return (
		<div className={wide ? styles.wide : undefined}>
			<dt>{label}</dt>
			<dd>
				{value}
				{note && <small> {note}</small>}
			</dd>
		</div>
	);
}

export default function FieldStationView({ data }: { data: StationData | null }) {
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		setNow(new Date());
		const id = window.setInterval(() => setNow(new Date()), 20_000);
		return () => window.clearInterval(id);
	}, []);

	const time = now ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit" }).format(now) : "–";
	const phase = now ? getMoonPhase(now) : null;
	const moon =
		phase === null
			? null
			: {
					name: PHASES[Math.round(phase * 8) % 8],
					lit: Math.round(getIlluminationFraction(phase) * 100),
					toFull: ((((0.5 - phase) % 1) + 1) % 1) * 29.53,
					toNew: ((1 - phase) % 1) * 29.53,
				};
	const alt = now ? Math.round(sunAltitude(now)) : null;
	const d = data;

	return (
		<section className={styles.station} aria-label="Copenhagen right now">
			<h2 className={styles.label}>
				Field station · Copenhagen <span className={styles.coords}>{STATION.coords}</span>
			</h2>
			<div className={styles.body}>
				<MoonCanvas phase={phase} />
				<dl className={styles.stats}>
					<Stat label="Local" value={time} />
					<Stat label="Air" value={d?.air ? `${d.air.temp.toFixed(1)}°C` : "–"} note={d?.air ? `${d.air.rh}% rh` : undefined} />
					<Stat
						label="Wind"
						value={
							d?.wind ? (
								<>
									<span className={styles.arrow} style={{ transform: `rotate(${d.wind.dir + 180}deg)` }} aria-hidden="true">
										↑
									</span>{" "}
									{d.wind.speed.toFixed(1)} m/s
								</>
							) : (
								"–"
							)
						}
						note={d?.wind ? `from ${COMPASS[Math.round(d.wind.dir / 45) % 8]}` : undefined}
					/>
					<Stat
						label="Sky"
						value={d?.sky ? `${d.sky.cloud < 10 ? "Clear" : d.sky.cloud < 40 ? "Few clouds" : d.sky.cloud < 75 ? "Broken" : "Overcast"} ${d.sky.cloud}%` : "–"}
						note={d?.sky ? `${Math.round(d.sky.pressure)} hPa` : undefined}
					/>
					<Stat
						label="Sun"
						value={d?.sun ? `↑${d.sun.rise} ↓${d.sun.set}` : "–"}
						note={alt === null ? undefined : alt >= 0 ? `${alt}° up` : `${-alt}° below`}
					/>
					<Stat
						label="Daylight"
						value={d?.daylight ? `${Math.floor(Math.round(d.daylight.seconds / 60) / 60)}h ${Math.round(d.daylight.seconds / 60) % 60}m` : "–"}
						note={
							d?.daylight
								? `${d.daylight.delta < 0 ? "−" : "+"}${Math.floor(Math.abs(Math.round(d.daylight.delta)) / 60)}m ${Math.abs(Math.round(d.daylight.delta)) % 60}s`
								: undefined
						}
					/>
					<Stat
						label="Moon"
						value={moon ? `${moon.name} ${moon.lit}%` : "–"}
						note={moon ? (moon.toFull < moon.toNew ? `full in ${moon.toFull.toFixed(1)}d` : `new in ${moon.toNew.toFixed(1)}d`) : undefined}
					/>
					<Stat
						label="Aurora"
						value={d?.kp != null ? `Kp ${d.kp.toFixed(1)}` : "–"}
						note={d?.kp != null ? (d.kp < 4 ? "quiet" : d.kp < 5 ? "unsettled" : d.kp < 6 ? "active · look north" : "storm · look north") : undefined}
					/>
					<Stat
						label="Pollen"
						wide
						value={d?.pollen ? (d.pollen.items.length ? d.pollen.items.join(" · ") : "None in the air") : "–"}
						note={d?.pollen ? `${d.pollen.aqi != null ? `air quality ${d.pollen.aqi} EAQI · ` : ""}${d.pollen.source}` : undefined}
					/>
				</dl>
			</div>
		</section>
	);
}
