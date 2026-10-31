import { EntityPage } from "@/components/entity-page";
import { getEntities } from "@/lib/data";
export default async function Page() { return <EntityPage kind="stores" initialRows={await getEntities("stores")}/>; }
