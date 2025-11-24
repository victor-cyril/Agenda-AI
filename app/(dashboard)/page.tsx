import { validateSession } from "@/lib/server-utils";
import HomeView from "@/modules/home/ui/views/home-view";
import { caller, prefetch, trpc } from "@/trpc/server";

export default async function Home() {
  const session = await validateSession();
  return <HomeView />;
}
