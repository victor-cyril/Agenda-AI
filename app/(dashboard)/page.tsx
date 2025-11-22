import { validateSession } from "@/lib/server-utis";
import HomeView from "@/modules/home/ui/views/home-view";

export default async function Home() {
  const session = await validateSession();
  return <HomeView />;
}
