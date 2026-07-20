"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col animate-pulse">
      {/* Header Skeleton */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-md bg-muted/40" />
          <Skeleton className="h-4 w-32 rounded bg-muted/40" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full bg-muted/40" />
      </header>

      {/* Message List Skeleton */}
      <div className="flex-1 overflow-y-hidden flex justify-center w-full">
        <div className="py-10 px-4 w-full max-w-4xl mx-auto flex flex-col gap-10">
          {/* User Message Skeleton */}
          <div className="flex w-full justify-end max-w-[75%] ml-auto">
            <Skeleton className="h-14 w-64 rounded-2xl bg-muted/30" />
          </div>

          {/* Assistant Message Skeleton */}
          <div className="flex w-full gap-4 max-w-[95%]">
            <Skeleton className="h-8 w-8 rounded-full bg-muted/45 shrink-0" />
            <div className="flex-1 flex flex-col gap-2.5 pt-1">
              <Skeleton className="h-4 w-full rounded bg-muted/25" />
              <Skeleton className="h-4 w-[90%] rounded bg-muted/25" />
              <Skeleton className="h-4 w-[65%] rounded bg-muted/25" />
            </div>
          </div>

          {/* User Message Skeleton */}
          <div className="flex w-full justify-end max-w-[75%] ml-auto">
            <Skeleton className="h-16 w-80 rounded-2xl bg-muted/30" />
          </div>

          {/* Assistant Message Skeleton with Tool call placeholder */}
          <div className="flex w-full gap-4 max-w-[95%] animate-pulse">
            <Skeleton className="h-8 w-8 rounded-full bg-muted/45 shrink-0" />
            <div className="flex-1 flex flex-col gap-3.5 pt-1">
              {/* Tool loading accordion placeholder */}
              <Skeleton className="h-10 w-full rounded-2xl bg-muted/15 border border-border/10" />
              
              <Skeleton className="h-4 w-[85%] rounded bg-muted/25" />
              <Skeleton className="h-4 w-[75%] rounded bg-muted/25" />
            </div>
          </div>
        </div>
      </div>

      {/* Composer Input Skeleton */}
      <div className="mx-auto w-full max-w-4xl px-4 pb-6 md:px-8 shrink-0">
        <Skeleton className="h-24 w-full rounded-2xl bg-muted/20 border border-border/10" />
      </div>
    </div>
  );
}
