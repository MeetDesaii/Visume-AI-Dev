"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@visume/ui/components/breadcrumb";
import { Separator } from "@visume/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@visume/ui/components/sidebar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { usePathname, useRouter } from "next/navigation";
import { Loader, Loader2, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@visume/ui/components/dropdown-menu";
import { Button } from "@visume/ui/components/button";
import { useUser } from "@clerk/nextjs";
import { AppSidebar } from "../dashboard/sidebar/app-sidebar";
import { format } from "date-fns";
import { LoaderOne } from "@visume/ui/components/loader";

interface DashboardProviderProps {
  children: ReactNode;
}

export default function DashboardProvider({
  children,
}: DashboardProviderProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { setTheme } = useTheme();
  const breadcrumbs = useBreadcrumbs();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname.includes("editor") || pathname.includes("report")) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p className="text-primary text-4xl">Visume AI</p>
        <LoaderOne />
      </div>
    );
  }

  if (!isSignedIn) {
    router.push("/login");
    return null;
  }

  return (
    <SidebarProvider
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
      className="overflow-hidden h-screen "
    >
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex justify-between h-[50px] mt-2 mx-3 rounded-2xl bg-white dark:bg-accent shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b px-4 ">
          <div className="flex items-center gap-2 ">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={item.href}>
                    {index > 0 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                    <BreadcrumbItem className="hidden md:block">
                      {item.isCurrentPage ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-4">
            {user.lastSignInAt && (
              <span className="text-sm text-secondary-foreground">
                {format(user.lastSignInAt, "MMMM dd, yyyy 'at' hh:mm a")}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex flex-1 flex-col rounded-2xl ">
          <div className="flex-1 p-3">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
