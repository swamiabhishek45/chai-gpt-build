"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { AppSidebar } from "./app-sidebar";

export interface ChatShellProps {
    children: React.ReactNode;
}

export function ChatShell({ children }: ChatShellProps) {
    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset className="min-h-svh overflow-hidden">{children}</SidebarInset>
        </SidebarProvider>
    )
}