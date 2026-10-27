import { getStationData } from "@/lib/fieldStation";
import FieldStationView from "./FieldStationView";

export default async function FieldStation() {
	const data = await getStationData();
	return <FieldStationView data={data} />;
}
