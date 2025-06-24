"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  ChartColumn,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/theme-toggle";

const data = {
  navMain: [
    {
      title: "Knowledge Base",
      url: "/knowledge-base",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Suggested Questions",
          url: "/knowledge-base/suggested-questions",
        },
      ],
    },
    {
      title: "Inquiries",
      url: "/inquiries",
      icon: Bot,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: ChartColumn,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <NavUser />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <ModeToggle />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
