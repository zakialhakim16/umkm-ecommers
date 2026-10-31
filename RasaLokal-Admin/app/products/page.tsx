import { EntityPage } from "@/components/entity-page";
import { getEntities } from "@/lib/data";
export default async function Page() { return <EntityPage kind="products" initialRows={await getEntities("products")}/>; }
