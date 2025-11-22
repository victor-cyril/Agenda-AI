import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GeneratedAvatar from "@/components/ui/generated-avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { authClient } from "@/lib/auth-client";
import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const DashboardUserButton = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const isMobile = useIsMobile();

  if (isPending || !session?.user) return null;

  const onLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in"); // redirect to login page
        },
      },
    });
  };

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between gap-x-2 bg-white/5 hover:bg-white/10 overflow-auto">
          <MenuTriggerComponent session={session} />
        </DrawerTrigger>

        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{session.user.name}</DrawerTitle>
            <DrawerDescription>{session.user.email}</DrawerDescription>
          </DrawerHeader>

          <DrawerFooter>
            <Button variant={"outline"} onClick={() => {}}>
              <CreditCardIcon className="size-4 text-black" />
              Billing
            </Button>
            <Button variant={"outline"} onClick={onLogout}>
              <LogOutIcon className="size-4 text-black" />
              Logout
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between gap-x-2 bg-white/5 hover:bg-white/10 overflow-auto">
        <MenuTriggerComponent session={session} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="right" className="w-72">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-medium truncate">{session.user.name}</span>
            <span className="truncate text-sm font-normal text-muted-foreground">
              {session.user.email}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer flex items-center justify-between">
          Billing
          <CreditCardIcon className="size-4" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer flex items-center justify-between"
        >
          Logout
          <CreditCardIcon className="size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DashboardUserButton;

const MenuTriggerComponent = (props: {
  session: NonNullable<ReturnType<typeof authClient.useSession>["data"]>;
}) => {
  const { session } = props;
  return (
    <>
      {session.user.image ? (
        <Avatar>
          <AvatarImage
            src={session.user.image}
            alt={session.user.name || "User Avatar"}
          />
          <AvatarFallback className="text-foreground">
            {session.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <GeneratedAvatar
          seed={session.user.name || "user"}
          className="size-9 mr-3"
          variant="initials"
        />
      )}

      <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
        <p className="text-sm truncate w-full">
          {session.user.name || "Unnamed User"}
        </p>
        <p className="text-xs truncate w-full">
          {session.user.email || "No email"}
        </p>
      </div>

      <ChevronDownIcon className="size-4 shrink-0" />
    </>
  );
};
