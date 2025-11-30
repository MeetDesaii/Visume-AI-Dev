"use client";

import * as React from "react";
import {
  AudioWaveform,
  Command,
  Frame,
  GalleryVerticalEnd,
  Home,
  Map,
  PieChart,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@visume/ui/components/sidebar";
import { useRouter } from "next/navigation";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { useUser } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/server";
import {
  IconBrandGithub,
  IconBrandGithubFilled,
  IconBrandLinkedinFilled,
  IconCircleDashedCheck,
  IconFile,
  IconHome,
} from "@tabler/icons-react";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: IconHome,
      isActive: true,
    },
    {
      title: "Resumes",
      url: "/dashboard/resumes",
      icon: IconFile,
      isActive: true,
    },
    {
      title: "Verify with Linkdin",
      url: "/dashboard/verified-resumes",
      icon: IconBrandLinkedinFilled,
      isActive: true,
    },
    {
      title: "Verify with Github",
      url: "/dashboard/github-verified-resumes",
      icon: IconBrandGithubFilled,
      isActive: true,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isSignedIn } = useUser();

  const router = useRouter();

  if (!isSignedIn) {
    router.push("/login");
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user as unknown as User} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
