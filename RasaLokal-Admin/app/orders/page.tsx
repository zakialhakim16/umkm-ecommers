import { EntityPage } from "@/components/entity-page";
import { getEntities } from "@/lib/data";
export default async function Page() { const [orders,drivers]=await Promise.all([getEntities("orders"),getEntities("drivers")]); return <EntityPage kind="orders" initialRows={orders} availableDrivers={drivers}/>; }
