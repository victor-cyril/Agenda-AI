"use client";

import React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BotIcon, StarOffIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import DashboardUserButton from "./dashboard-user-button";
import DashboardTrial from "./dashboard-trial";

const firstSection = [
  {
    icon: VideoIcon,
    label: "Meetings",
    href: "/meetings",
  },
  {
    icon: BotIcon,
    label: "Agents",
    href: "/agents",
  },
];

const secondSection = [
  {
    icon: StarOffIcon,
    label: "Upgrade",
    href: "/upgrade",
  },
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground">
        <Link href="/" className="flex items-center gap-2 px-2 pt-2">
          <Image
            src="/logo.svg"
            alt="Agenda AI Logo"
            width={36}
            height={36}
            className="size-9"
          />

          <p className="text-2xl font-semibold">Agenda AI</p>
        </Link>
      </SidebarHeader>

      <div className="px-4 py-2">
        <Separator className="opacity-10 text-[#5D6B68]" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => {
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                        pathname === item.href &&
                          "bg-linear-to-r/oklch border-[#5D6B68]/10"
                      )}
                      isActive={pathname === item.href}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 p-1"
                      >
                        <item.icon className="size-5! shrink-0" />
                        <span className="text-sm font-medium tracking-tight">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 py-2">
          <Separator className="opacity-10 text-[#5D6B68]" />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondSection.map((item) => {
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                        pathname === item.href &&
                          "bg-linear-to-r/oklch border-[#5D6B68]/10"
                      )}
                      isActive={pathname === item.href}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 p-1"
                      >
                        <item.icon className="size-5! shrink-0" />
                        <span className="text-sm font-medium tracking-tight">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="text-white p-3">
        <DashboardTrial />
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
