"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  Trash2Icon,
  Search,
  MessageSquarePlus,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { isToday, isYesterday, subDays, isAfter } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useConversations,
  useDeleteConversation,
  useUpdateConversation,
} from "@/features/conversation/hooks/use-conversation";
import { cn } from "@/lib/utils";

type Conversation = NonNullable<
  ReturnType<typeof useConversations>["data"]
>[number];

function groupConversations(conversations: Conversation[]) {
  const groups: { [key: string]: Conversation[] } = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);

  conversations.forEach((conv) => {
    if (conv.isPinned) {
      groups.Pinned.push(conv);
      return;
    }

    const date = new Date(conv.lastMessageAt);
    if (isToday(date)) {
      groups.Today.push(conv);
    } else if (isYesterday(date)) {
      groups.Yesterday.push(conv);
    } else if (isAfter(date, sevenDaysAgo)) {
      groups["Previous 7 Days"].push(conv);
    } else {
      groups.Older.push(conv);
    }
  });

  return groups;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: conversations, isLoading } = useConversations();
  const [searchQuery, setSearchQuery] = useState("");

  const activeId = pathname.startsWith("/c/")
    ? pathname.split("/")[2]
    : undefined;

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-border/40 bg-sidebar/50 backdrop-blur-md">
      <SidebarHeader className="gap-2 px-3 pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="font-semibold tracking-tight hover:bg-transparent"
              render={<Link href="/" />}
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20">
                C
              </span>
              <span className="font-semibold text-foreground text-sm tracking-tight">ChaiGPT</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton
              tooltip="New chat"
              render={<Link href="/" />}
              className="bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl px-3.5 py-2.5 text-xs text-primary transition-all duration-200 flex items-center justify-center gap-1.5 font-medium shadow-sm hover:shadow"
            >
              <MessageSquarePlus size={14} />
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 mt-2">
        {/* Search Input */}
        <div className="px-3.5 py-2.5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/30 border border-border/80 hover:border-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/40 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable Chat List */}
        <ScrollArea className="flex-1 px-1.5">
          <div className="py-2 pr-1 flex flex-col gap-0.5">
            <ChatList
              conversations={conversations}
              isLoading={isLoading}
              activeId={activeId}
              searchQuery={searchQuery}
            />
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-3 bg-sidebar/30">
        <SidebarFooterMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function ChatList({
  conversations,
  isLoading,
  activeId,
  searchQuery,
}: {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  activeId: string | undefined;
  searchQuery: string;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5 px-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <Skeleton className="h-8.5 w-full rounded-xl" />
          </SidebarMenuItem>
        ))}
      </div>
    );
  }

  const filtered = conversations?.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!filtered?.length) {
    return (
      <p className="px-3 py-6 text-xs text-muted-foreground/60 text-center">
        No chats found
      </p>
    );
  }

  const groups = groupConversations(filtered);

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groups).map(([groupName, items]) => {
        if (items.length === 0) return null;

        return (
          <div key={groupName} className="flex flex-col gap-1">
            <div className="px-3.5 py-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider select-none">
              {groupName}
            </div>
            <div className="flex flex-col gap-0.5">
              {items.map((conversation) => (
                <ChatItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={activeId === conversation.id}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChatItem({
  conversation,
  isActive,
}: {
  conversation: Conversation;
  isActive: boolean;
}) {
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation(
    isActive ? conversation.id : undefined
  );

  function handleRename() {
    const next = window.prompt("Rename chat", conversation.title);
    if (!next || next.trim() === conversation.title) return;
    updateConversation.mutate({ id: conversation.id, title: next });
  }

  return (
    <SidebarMenuItem className="relative group/item flex items-center">
      <SidebarMenuButton
        isActive={isActive}
        tooltip={conversation.title}
        render={<Link href={`/c/${conversation.id}`} />}
        className={cn(
          "relative overflow-hidden px-3.5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between w-full text-left select-none border border-transparent",
          isActive
            ? "bg-primary/5 dark:bg-primary/10 text-primary border-primary/10 font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <span className="truncate pr-6 text-xs">{conversation.title}</span>
        
        {/* Discord-style left accent indicator line */}
        <div
          className={cn(
            "absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r-full transition-all duration-200 transform origin-center",
            isActive ? "scale-y-100" : "scale-y-0 group-hover/item:scale-y-100"
          )}
        />
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              showOnHover
              className="data-popup-open:bg-sidebar-accent mr-1 hover:bg-muted text-muted-foreground rounded-lg transition-colors"
            />
          }
        >
          <MoreHorizontalIcon className="size-3.5" />
          <span className="sr-only">Chat actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="rounded-xl p-1 shadow-lg border border-border/80 bg-popover/95 backdrop-blur-md">
          <DropdownMenuItem onClick={handleRename} className="rounded-lg text-xs py-1.5">
            <PencilIcon className="size-3.5 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-lg text-xs py-1.5"
            onClick={() =>
              updateConversation.mutate({
                id: conversation.id,
                isPinned: !conversation.isPinned,
              })
            }
          >
            {conversation.isPinned ? <PinOffIcon className="size-3.5 mr-2" /> : <PinIcon className="size-3.5 mr-2" />}
            {conversation.isPinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 border-border/60" />
          <DropdownMenuItem
            variant="destructive"
            className="rounded-lg text-xs py-1.5"
            onClick={() => deleteConversation.mutate(conversation.id)}
          >
            <Trash2Icon className="size-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function SidebarFooterMenu() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <SidebarMenu className="gap-2">
      <SidebarMenuItem>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 py-1.5"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          Toggle theme
        </Button>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <div className="flex items-center gap-2.5 px-2 py-1 bg-muted/20 dark:bg-muted/5 rounded-xl border border-border/20">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-7 rounded-lg",
              },
            }}
          />
          <span className="truncate text-xs font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
            Account
          </span>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}