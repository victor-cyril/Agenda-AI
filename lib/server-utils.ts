import "server-only";
import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getServerSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
};

export const validateSession = async () => {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
};
