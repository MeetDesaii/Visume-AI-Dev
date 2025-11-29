"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryProvider } from "./query-provider";
import { Toaster } from "@visume/ui/components/sonner";
export function RootLayoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <QueryProvider>
        <Toaster richColors />
        {children}
      </QueryProvider>
    </NextThemesProvider>
  );
}
